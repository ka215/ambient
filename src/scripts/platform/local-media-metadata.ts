import type { YouTubeMetadataPayload } from '../types/ambient';

const ID3_HEADER_SIZE = 10;
const ID3_V2_2_FRAME_HEADER_SIZE = 6;
const ID3_V2_3_FRAME_HEADER_SIZE = 10;
const MAX_ID3_READ_BYTES = 512 * 1024;

interface LocalMediaMetadataOptions {
  fallbackTitle?: string;
}

interface ID3Frame {
  id: string;
  data: Uint8Array;
  nextOffset: number;
}

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

function readUint24(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] || 0) << 16)
    | ((bytes[offset + 1] || 0) << 8)
    | (bytes[offset + 2] || 0);
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

function normalizeTextValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function selectPreferredText(existingValue: string, nextValue: string): string {
  return existingValue !== '' ? existingValue : normalizeTextValue(nextValue);
}

function getInitialFrameOffset(bytes: Uint8Array, version: number, tagEnd: number): number {
  const flags = bytes[5] || 0;
  const hasExtendedHeader = (flags & 0x40) !== 0;
  if (!hasExtendedHeader || version === 2) {
    return ID3_HEADER_SIZE;
  }

  if (version === 3 && ID3_HEADER_SIZE + 4 <= tagEnd) {
    return Math.min(tagEnd, ID3_HEADER_SIZE + 4 + readUint32(bytes, ID3_HEADER_SIZE));
  }
  if (version === 4 && ID3_HEADER_SIZE + 4 <= tagEnd) {
    return Math.min(tagEnd, ID3_HEADER_SIZE + readSyncsafeInteger(bytes, ID3_HEADER_SIZE));
  }
  return ID3_HEADER_SIZE;
}

function readFrame(bytes: Uint8Array, offset: number, version: number, tagEnd: number): ID3Frame | null {
  const headerSize = version === 2 ? ID3_V2_2_FRAME_HEADER_SIZE : ID3_V2_3_FRAME_HEADER_SIZE;
  const frameIdLength = version === 2 ? 3 : 4;
  if (offset + headerSize > tagEnd) {
    return null;
  }

  const frameId = new TextDecoder('ascii').decode(bytes.slice(offset, offset + frameIdLength));
  if (!(version === 2 ? /^[A-Z0-9]{3}$/.test(frameId) : /^[A-Z0-9]{4}$/.test(frameId))) {
    return null;
  }

  const frameSize = version === 2
    ? readUint24(bytes, offset + 3)
    : version === 4
      ? readSyncsafeInteger(bytes, offset + 4)
      : readUint32(bytes, offset + 4);
  if (frameSize <= 0 || offset + headerSize + frameSize > tagEnd) {
    return null;
  }

  return {
    id: frameId,
    data: bytes.slice(offset + headerSize, offset + headerSize + frameSize),
    nextOffset: offset + headerSize + frameSize,
  };
}

export async function extractLocalMediaMetadata(file: File, options: LocalMediaMetadataOptions = {}): Promise<{
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
      titleFallback: '',
      artist: '',
      desc: '',
      descFallback: '',
    };

    let offset = getInitialFrameOffset(bytes, version, end);
    while (offset < end) {
      const frame = readFrame(bytes, offset, version, end);
      if (!frame) {
        break;
      }
      const frameText = frame.id === 'COMM' || frame.id === 'COM'
        ? decodeCommentFrame(frame.data)
        : decodeTextFrame(frame.data);
      if (frame.id === 'TIT2' || frame.id === 'TT2') {
        metadata.title = selectPreferredText(metadata.title, frameText);
      } else if (frame.id === 'TIT3' || frame.id === 'TT3') {
        metadata.titleFallback = selectPreferredText(metadata.titleFallback, frameText);
      } else if (
        frame.id === 'TPE1' || frame.id === 'TP1'
        || frame.id === 'TPE2' || frame.id === 'TP2'
        || frame.id === 'TPE3' || frame.id === 'TP3'
        || frame.id === 'TPE4' || frame.id === 'TP4'
        || frame.id === 'TOPE' || frame.id === 'TOA'
      ) {
        metadata.artist = selectPreferredText(metadata.artist, frameText);
      } else if (frame.id === 'COMM' || frame.id === 'COM') {
        metadata.desc = selectPreferredText(metadata.desc, frameText);
      } else if (frame.id === 'TIT1' || frame.id === 'TT1') {
        metadata.descFallback = selectPreferredText(metadata.descFallback, frameText);
      }
      offset = frame.nextOffset;
    }

    metadata.title = selectPreferredText(metadata.title, metadata.titleFallback);
    metadata.title = selectPreferredText(metadata.title, options.fallbackTitle || '');
    metadata.desc = selectPreferredText(metadata.desc, metadata.descFallback);

    if (metadata.title !== '') {
      metadata.title = normalizeTextValue(metadata.title);
    }
    if (metadata.artist !== '') {
      metadata.artist = normalizeTextValue(metadata.artist);
    }
    if (metadata.desc !== '') {
      metadata.desc = normalizeTextValue(metadata.desc);
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
