use byteorder::ByteOrder;
use bytes::Buf;
use prost::Message;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

pub struct Sender {
    writer: std::pin::Pin<Box<dyn tokio::io::AsyncWrite + Send + 'static>>,
}

impl Sender {
    pub fn new_from_stdout() -> Self {
        Sender {
            writer: Box::pin(tokio::io::stdout()),
        }
    }

    pub async fn send(&mut self, req: tango_protos::ipc::FromCoreMessage) -> anyhow::Result<()> {
        let buf = req.encode_to_vec();
        self.writer.write_u32_le(buf.len() as u32).await?;
        self.writer.flush().await?;
        self.writer.write_all(&buf).await?;
        self.writer.flush().await?;
        Ok(())
    }
}

pub struct Receiver {
    reader: std::pin::Pin<Box<dyn tokio::io::AsyncRead + Send + 'static>>,
    buf: bytes::BytesMut,
}

impl Receiver {
    pub fn new_from_stdin() -> Self {
        Receiver {
            reader: Box::pin(tokio::io::stdin()),
            buf: bytes::BytesMut::new(),
        }
    }

    pub async fn receive(&mut self) -> anyhow::Result<tango_protos::ipc::ToCoreMessage> {
        while self.buf.len() < 4 {
            self.reader.read_buf(&mut self.buf).await?;
        }
        let size = byteorder::LittleEndian::read_u32(&self.buf[0..4]) as usize;

        while self.buf.len() < 4 + size {
            self.reader.read_buf(&mut self.buf).await?;
        }
        let resp = tango_protos::ipc::ToCoreMessage::decode(&self.buf[4..4 + size])?;

        self.buf.advance(4 + size);

        Ok(resp)
    }
}
