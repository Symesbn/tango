# Tango

Tango is rollback netplay for Mega Man Battle Network.

## Design

Tango is composed of two parts: the launcher and the core. The launcher performs high-level control operations, such as starting matches and configuration, while the core performs emulation and netplay. There are additional supplementary tools (replayview, replaydump, keymaptool) that the launcher may also use for certain specialized operations.

The core and launcher send IPC requests to each other over stdout/stdin pipes.

## Building

### Core

The core is written in Rust. Despite being for Windows, you must have a POSIX-y MinGW environment set up. The following instructions are for Ubuntu.

1.  Install Rust.

    ```sh
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```

1.  Install the Rust target and toolchain for `x86_64-pc-windows-gnu`.

    ```sh
    rustup target add x86_64-pc-windows-gnu
    rustup toolchain install stable-x86_64-pc-windows-gnu
    ```

1.  Install mingw-w64.

    ```sh
    sudo apt-get install -y mingw-w64
    ```

1.  Ensure mingw-w64 is using the POSIX threading model.

    ```sh
    sudo update-alternatives --install /usr/bin/x86_64-w64-mingw32-gcc x86_64-w64-mingw32-gcc /usr/bin/x86_64-w64-mingw32-gcc-win32 60 &&
    sudo update-alternatives --install /usr/bin/x86_64-w64-mingw32-gcc x86_64-w64-mingw32-gcc /usr/bin/x86_64-w64-mingw32-gcc-posix 90 &&
    sudo update-alternatives --config x86_64-w64-mingw32-gcc &&
    sudo update-alternatives --install /usr/bin/x86_64-w64-mingw32-g++ x86_64-w64-mingw32-g++ /usr/bin/x86_64-w64-mingw32-g++-win32 60 &&
    sudo update-alternatives --install /usr/bin/x86_64-w64-mingw32-g++ x86_64-w64-mingw32-g++ /usr/bin/x86_64-w64-mingw32-g++-posix 90 &&
    sudo update-alternatives --config x86_64-w64-mingw32-g++
    ```

1.  Build the core.

    ```sh
    cd core &&
    cargo build --target x86_64-pc-windows-gnu
    ```

### Launcher

The launcher is written in Node + Electron.

1.  Run `npm install` to get all Node dependencies.

    ```sh
    cd launcher &&
    npm install
    ```

1.  Make a `dev-bin` directory in `launcher` and copy the core files into it. Note you will need to do this on every rebuild.

    ```sh
    mkdir launcher/dev-bin &&
    cp /usr/x86_64-w64-mingw32/lib/libwinpthread-1.dll \
        /usr/lib/gcc/x86_64-w64-mingw32/9.3-posix/*.dll \
        core/target/x86_64-pc-windows-gnu/release/tango-core.exe \
        core/target/x86_64-pc-windows-gnu/release/replayview.exe \
        core/target/x86_64-pc-windows-gnu/release/replaydump.exe \
        core/target/x86_64-pc-windows-gnu/release/keymaptool.exe \
        launcher/dev-bin
    ```

1.  In the `launcher` directory, you can use the following commands:

    ```sh
    npm run start  # start webpack (keep this running in the background)
    npm run start:main  # start electron (run this in a new terminal)
    ```
