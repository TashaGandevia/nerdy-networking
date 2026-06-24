// CIDR / subnetting helpers used by the Address Space mechanic

/**
 * Converts a CIDR prefix length to a dotted-decimal subnet mask.
 * e.g. 24 → "255.255.255.0"
 *
 * @param prefix - Prefix length (0–32)
 */
export function prefixToMask(prefix: number): string {
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  return [
    (mask >>> 24) & 0xff,
    (mask >>> 16) & 0xff,
    (mask >>> 8)  & 0xff,
    mask          & 0xff,
  ].join('.')
}

/**
 * Converts a dotted-decimal IP string to a 32-bit unsigned integer.
 *
 * @param ip - e.g. "192.168.1.0"
 */
export function ipToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0
}

/**
 * Converts a 32-bit unsigned integer to a dotted-decimal IP string.
 *
 * @param int - 32-bit unsigned integer
 */
export function intToIp(int: number): string {
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8)  & 0xff,
    int          & 0xff,
  ].join('.')
}

/**
 * Returns the network address (host bits zeroed) for a given IP and prefix.
 *
 * @param ip - Any IP in the block
 * @param prefix - Prefix length (0–32)
 */
export function networkAddress(ip: string, prefix: number): string {
  const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  return intToIp((ipToInt(ip) & maskInt) >>> 0)
}

/**
 * Returns the broadcast address (host bits all-ones) for a given IP and prefix.
 *
 * @param ip - Any IP in the block
 * @param prefix - Prefix length (0–32)
 */
export function broadcastAddress(ip: string, prefix: number): string {
  const maskInt  = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  const hostMask = (~maskInt) >>> 0
  return intToIp(((ipToInt(ip) & maskInt) | hostMask) >>> 0)
}

/**
 * Returns the number of usable host addresses in a subnet.
 *
 * @param prefix - Prefix length (0–32)
 */
export function usableHosts(prefix: number): number {
  if (prefix >= 31) return prefix === 31 ? 2 : 1
  return Math.pow(2, 32 - prefix) - 2
}

/** Represents a parsed CIDR block */
export interface CIDRBlock {
  network: string
  prefix: number
  broadcast: string
  firstHost: string
  lastHost: string
  totalHosts: number
  usableHosts: number
}

/**
 * Parses a CIDR string (e.g. "10.0.0.0/24") into a CIDRBlock descriptor.
 *
 * @param cidr - CIDR notation string
 * @returns Parsed block or null if the input is invalid
 */
export function parseCIDR(cidr: string): CIDRBlock | null {
  const parts = cidr.split('/')
  if (parts.length !== 2) return null
  const prefix = parseInt(parts[1], 10)
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return null

  const network   = networkAddress(parts[0], prefix)
  const broadcast = broadcastAddress(parts[0], prefix)
  const total     = Math.pow(2, 32 - prefix)
  const usable    = usableHosts(prefix)
  const firstHost = prefix < 31 ? intToIp(ipToInt(network) + 1) : network
  const lastHost  = prefix < 31 ? intToIp(ipToInt(broadcast) - 1) : broadcast

  return { network, prefix, broadcast, firstHost, lastHost, totalHosts: total, usableHosts: usable }
}

/**
 * Checks whether a CIDR block fits within a parent block (for VLSM validation).
 *
 * @param child - Child CIDR string (e.g. "10.0.1.0/25")
 * @param parent - Parent CIDR string (e.g. "10.0.0.0/22")
 */
export function isSubnetOf(child: string, parent: string): boolean {
  const c = parseCIDR(child)
  const p = parseCIDR(parent)
  if (!c || !p) return false
  if (c.prefix < p.prefix) return false
  const childNet  = ipToInt(c.network)
  const parentNet = ipToInt(p.network)
  const maskInt   = p.prefix === 0 ? 0 : (~0 << (32 - p.prefix)) >>> 0
  return (childNet & maskInt) >>> 0 === (parentNet & maskInt) >>> 0
}
