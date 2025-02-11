#![windows_subsystem = "windows"]

use clap::Parser;
use cpal::traits::{HostTrait, StreamTrait};

#[derive(clap::Parser)]
struct Cli {
    #[clap(long)]
    remote: bool,

    #[clap(parse(from_os_str))]
    rom_path: std::path::PathBuf,

    #[clap(parse(from_os_str))]
    path: std::path::PathBuf,
}

fn main() -> Result<(), anyhow::Error> {
    env_logger::Builder::from_default_env()
        .filter(Some("tango_core"), log::LevelFilter::Info)
        .filter(Some("replayview"), log::LevelFilter::Info)
        .init();
    mgba::log::init();

    let args = Cli::parse();

    let mut f = std::fs::File::open(args.path)?;

    let replay = tango_core::replay::Replay::decode(&mut f)?;

    log::info!(
        "replay is for {} (crc32 = {:08x})",
        replay.local_state.as_ref().unwrap().rom_title(),
        replay.local_state.as_ref().unwrap().rom_crc32()
    );

    let mut core = mgba::core::Core::new_gba("tango_core")?;

    let vf = mgba::vfile::VFile::open(&args.rom_path, mgba::vfile::flags::O_RDONLY)?;
    core.as_mut().load_rom(vf)?;

    core.enable_video_buffer();

    let vbuf = std::sync::Arc::new(parking_lot::Mutex::new(vec![
        0u8;
        (mgba::gba::SCREEN_WIDTH * mgba::gba::SCREEN_HEIGHT * 4)
            as usize
    ]));

    let audio_device = cpal::default_host()
        .default_output_device()
        .ok_or_else(|| anyhow::format_err!("could not open audio device"))?;

    let supported_config = tango_core::audio::get_supported_config(&audio_device)?;
    log::info!("selected audio config: {:?}", supported_config);

    let event_loop = winit::event_loop::EventLoop::new();

    let window = {
        let size =
            winit::dpi::LogicalSize::new(mgba::gba::SCREEN_WIDTH * 3, mgba::gba::SCREEN_HEIGHT * 3);
        winit::window::WindowBuilder::new()
            .with_title("tango_core replayview")
            .with_inner_size(size)
            .with_min_inner_size(size)
            .build(&event_loop)?
    };

    let mut pixels = {
        let window_size = window.inner_size();
        let surface_texture =
            pixels::SurfaceTexture::new(window_size.width, window_size.height, &window);
        pixels::PixelsBuilder::new(
            mgba::gba::SCREEN_WIDTH,
            mgba::gba::SCREEN_HEIGHT,
            surface_texture,
        )
        .build()?
    };

    let done = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
    let hooks = tango_core::hooks::HOOKS
        .get(&core.as_ref().game_title())
        .unwrap();
    hooks.prepare_for_fastforward(core.as_mut());

    let local_player_index = if !args.remote {
        replay.local_player_index
    } else {
        1 - replay.local_player_index
    };

    let mut input_pairs = replay.input_pairs.clone();
    if args.remote {
        for pair in input_pairs.iter_mut() {
            std::mem::swap(&mut pair.local, &mut pair.remote);
        }
    }

    {
        let done = done.clone();
        core.set_traps(
            hooks.fastforwarder_traps(tango_core::fastforwarder::State::new(
                local_player_index,
                input_pairs,
                0,
                0,
                Box::new(move || {
                    done.store(true, std::sync::atomic::Ordering::Relaxed);
                }),
            )),
        );
    }

    let thread = mgba::thread::Thread::new(core);
    thread.start().expect("start thread");
    let thread_handle = thread.handle();
    thread_handle.pause();
    thread_handle.lock_audio().sync_mut().set_fps_target(60.0);
    {
        let vbuf = vbuf.clone();
        thread.set_frame_callback(move |_core, video_buffer| {
            let mut vbuf = vbuf.lock();
            vbuf.copy_from_slice(video_buffer);
            for i in (0..vbuf.len()).step_by(4) {
                vbuf[i + 3] = 0xff;
            }
        });
    }

    let stream = tango_core::audio::open_stream(
        &audio_device,
        &supported_config,
        tango_core::audio::mgba_stream::MGBAStream::new(
            thread.handle(),
            supported_config.sample_rate(),
        ),
    )?;
    stream.play()?;

    thread.handle().run_on_core(move |mut core| {
        core.load_state(replay.local_state.as_ref().unwrap())
            .expect("load state");
    });
    thread.handle().unpause();

    {
        let vbuf = vbuf.clone();
        event_loop.run(move |event, _, control_flow| {
            *control_flow = winit::event_loop::ControlFlow::Poll;

            if done.load(std::sync::atomic::Ordering::Relaxed) {
                *control_flow = winit::event_loop::ControlFlow::Exit;
                return;
            }

            match event {
                winit::event::Event::MainEventsCleared => {
                    let vbuf = vbuf.lock().clone();
                    pixels.get_frame().copy_from_slice(&vbuf);
                    pixels.render().expect("render pixels");
                }
                winit::event::Event::WindowEvent {
                    event: ref window_event,
                    ..
                } => {
                    match window_event {
                        winit::event::WindowEvent::CloseRequested => {
                            *control_flow = winit::event_loop::ControlFlow::Exit;
                        }
                        winit::event::WindowEvent::Resized(size) => {
                            pixels.resize_surface(size.width, size.height);
                        }
                        _ => {}
                    };
                }
                _ => {}
            }
        });
    }
}
