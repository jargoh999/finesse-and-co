import { NextResponse } from 'next/server';

export function EventStreamResponse() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  return {
    stream: stream.readable,
    send(data: any) {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      writer.write(encoder.encode(message));
    },
    close() {
      writer.close();
    },
  };
}
