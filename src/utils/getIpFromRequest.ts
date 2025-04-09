import { IncomingMessage } from 'http';

export function getIpFromRequest(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return ips[0].trim();
  }

  let ip = req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';

  if (ip?.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  return ip;
}
