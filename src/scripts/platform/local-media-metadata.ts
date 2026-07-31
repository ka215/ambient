import type { YouTubeMetadataPayload } from '../types/ambient';

const ID3_HEADER_SIZE = 10;
const ID3_FRAME_HEADER_SIZE = 10;
const MAX_ID3_READ_BYTES = 512 * 1024;

function readSyncsafeInteger(bytes: Uint8Array, offset: number): number {
  return (((bytes[offset] ?? 0) & 0x7f) << 21)
    | (((bytes[offset + 1] ?? 0) & 0x7f) << 14)
    | (((bytes[offset + 2] ?? 0) & 0x7f) << 7)
    | ((bytes[offset + 3] ?? 0) & 0x7f);
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] || 0) << 24)
    | ((bytes[offset + 1] || 0) << 16)
    | ((bytes[offset + 2] || 0) << 8)
    | (bytes[offset + 3] || 0);
}

function decodeText(bytes: Uint8Array, encoding: number): string {
  if (bytes.length === 0) {
    return '';
  }
  if (encoding === 1 || encoding === 2) {
    return new TextDecoder('utf-16').decode(bytes).replace(/\u0000/g, '').trim();
  }
  if (encoding === 3) {
    return new TextDecoder('utf-8').decode(bytes).replace(/\u0000/g, '').trim();
  }
  return new TextDecoder('iso-8859-1').decode(bytes).replace(/\u0000/g, '').trim();
}

function decodeTextFrame(frameData: Uint8Array): string {
  const encoding = frameData[0] || 0;
  return decodeText(frameData.slice(1), encoding);
}

function decodeCommentFrame(frameData: Uint8Array): string {
  const encoding = frameData[0] || 0;
  const payload = frameData.slice(4);
  const terminatorLength = encoding === 1 || encoding === 2 ? 2 : 1;
  let textStart = 0;
  for (let i = 0; i < payload.length; i += 1) {
    if (terminatorLength === 2 && payload[i] === 0 && payload[i + 1] === 0) {
      textStart = i + 2;
      break;
    }
    if (terminatorLength === 1 && payload[i] === 0) {
      textStart = i + 1;
      break;
    }
  }
  return decodeText(payload.slice(textStart), encoding);
}

export async function extractLocalMediaMetadata(file: File): Promise<{
  ok: boolean;
  data?: YouTubeMetadataPayload;
  reason?: 'unsupported-format' | 'not-found' | 'parse-error';
}> {
  if (!/\.(mp3|aac|m4a)$/i.test(file.name)) {
    return { ok: false, reason: 'unsupported-format' };
  }

  try {
    const bytes = new Uint8Array(await file.slice(0, MAX_ID3_READ_BYTES).arrayBuffer());
    if (
      bytes.length < ID3_HEADER_SIZE
      || bytes[0] !== 0x49
      || bytes[1] !== 0x44
      || bytes[2] !== 0x33
    ) {
      return { ok: false, reason: 'not-found' };
    }

    const version = bytes[3] || 3;
    const tagSize = readSyncsafeInteger(bytes, 6);
    const end = Math.min(bytes.length, ID3_HEADER_SIZE + tagSize);
    const metadata = {
      title: '',
      artist: '',
      desc: '',
    };

    let offset = ID3_HEADER_SIZE;
    while (offset + ID3_FRAME_HEADER_SIZE <= end) {
      const frameId = new TextDecoder('ascii').decode(bytes.slice(offset, offset + 4));
      if (!/^[A-Z0-9]{4}$/.test(frameId)) {
        break;
      }
      const frameSize = version === 4
        ? readSyncsafeInteger(bytes, offset + 4)
        : readUint32(bytes, offset + 4);
      if (frameSize <= 0 || offset + ID3_FRAME_HEADER_SIZE + frameSize > end) {
        break;
      }
      const frameData = bytes.slice(offset + ID3_FRAME_HEADER_SIZE, offset + ID3_FRAME_HEADER_SIZE + frameSize);
      if (frameId === 'TIT2') {
        metadata.title = decodeTextFrame(frameData);
      } else if (frameId === 'TPE1') {
        metadata.artist = decodeTextFrame(frameData);
      } else if (frameId === 'COMM') {
        metadata.desc = decodeCommentFrame(frameData);
      }
      offset += ID3_FRAME_HEADER_SIZE + frameSize;
    }

    if (metadata.title === '' && metadata.artist === '' && metadata.desc === '') {
      return { ok: false, reason: 'not-found' };
    }

    return {
      ok: true,
      data: {
        videoId: '',
        title: metadata.title,
        artist: metadata.artist,
        desc: metadata.desc,
        source: 'local-file-metadata',
      },
    };
  } catch (_error) {
    return { ok: false, reason: 'parse-error' };
  }
}
