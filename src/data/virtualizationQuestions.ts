import type { SdnDifficulty } from './sdnQuestions'

export type VirtualizationTopicId = 'virtual-circuits' | 'vlans' | 'virtual-networks' | 'vpns' | 'virtual-switches' | 'overlays'
export interface VirtualizationQuestion { prompt: string; options: string[]; answer: number; explanation: string }
export interface VirtualizationTopic { title: string; objective: string; questions: Record<SdnDifficulty, VirtualizationQuestion[]> }
const q = (prompt: string, options: string[], answer: number, explanation: string): VirtualizationQuestion => ({ prompt, options, answer, explanation })
export const VIRTUALIZATION_TOPIC_ORDER: VirtualizationTopicId[] = ['virtual-circuits', 'vlans', 'virtual-networks', 'vpns', 'virtual-switches', 'overlays']

export const VIRTUALIZATION_QUESTION_BANK: Record<VirtualizationTopicId, VirtualizationTopic> = {
  'virtual-circuits': {
    title: 'Virtual Circuits', objective: 'Create logical paths with predictable delivery.',
    questions: {
      easy: [
        q('What is the primary purpose of a Virtual Circuit?', ['Encrypt traffic', 'Create a logical communication path between two endpoints', 'Compress packets', 'Increase bandwidth'], 1, 'A virtual circuit creates a logical communication path through shared infrastructure.'),
        q('Unlike a datagram network, a Virtual Circuit:', ['Sends every packet independently', 'Establishes a path before data transmission', 'Uses only Ethernet', 'Requires SDN'], 1, 'A virtual circuit establishes forwarding state before sending data.'),
        q('Which network technology traditionally uses Virtual Circuits?', ['MPLS / ATM', 'Wi-Fi', 'Ethernet hubs', 'Bluetooth'], 0, 'ATM uses virtual circuits, and MPLS label-switched paths have similar connection-oriented behavior.'),
      ],
      medium: [q('Why might a company choose a Virtual Circuit?', ['Guaranteed path and predictable performance', 'Lower electricity usage', 'Automatic encryption', 'Faster CPUs'], 0, 'An established path can support predictable delivery and service guarantees.')],
      hard: [q('What is the tradeoff of Virtual Circuits compared to datagram routing?', ['They require connection setup before communication', 'They use less memory', 'They eliminate routing tables', 'They automatically load balance'], 0, 'Predictability requires setup time and connection state in the network.')],
    },
  },
  vlans: {
    title: 'VLANs', objective: 'Segment shared Layer 2 fabrics into isolated broadcast domains.',
    questions: {
      easy: [
        q('What does VLAN stand for?', ['Virtual Local Area Network', 'Variable LAN', 'Virtual Link Access Network', 'Verified LAN'], 0, 'VLAN stands for Virtual Local Area Network.'),
        q('Why are VLANs used?', ['Increase CPU speed', 'Separate devices into isolated logical networks', 'Compress traffic', 'Encrypt packets'], 1, 'VLANs create isolated logical broadcast domains on shared switches.'),
        q('Can two devices in different VLANs communicate directly?', ['Yes', 'No, not without routing'], 1, 'Communication between VLANs requires a Layer 3 routing function.'),
      ],
      medium: [
        q('What type of traffic is limited by VLANs?', ['Broadcast traffic', 'Internet traffic', 'Wireless traffic', 'VPN traffic'], 0, 'A VLAN limits Layer 2 broadcasts to its own broadcast domain.'),
        q('Which switch port typically carries multiple VLANs?', ['Access Port', 'Trunk Port', 'Host Port', 'Edge Port'], 1, 'A trunk carries tagged traffic for multiple VLANs.'),
      ],
      hard: [q('Why do large enterprise networks use VLANs?', ['To improve logical organization, security, and reduce broadcast domains', 'To replace routers', 'To increase Internet speed', 'To eliminate switches'], 0, 'VLANs organize networks, isolate groups, and contain broadcasts.')],
    },
  },
  'virtual-networks': {
    title: 'Virtual Networks', objective: 'Build independent logical topologies over shared infrastructure.',
    questions: {
      easy: [
        q('A virtual network is:', ['A logical network independent of the physical infrastructure', 'A faster Ethernet cable', 'A wireless router', 'A VPN only'], 0, 'Virtual networks decouple logical connectivity from physical wiring.'),
        q('Why do cloud providers use virtual networks?', ['To isolate different customers while sharing hardware', 'To reduce electricity usage', 'To remove switches', 'To replace IP addresses'], 0, 'Virtual networks let tenants share infrastructure without sharing traffic.'),
        q('Can multiple virtual networks exist on one physical network?', ['Yes', 'No'], 0, 'Many isolated virtual networks can share the same physical fabric.'),
      ],
      medium: [
        q('What is one major advantage of virtual networks?', ['Easier scalability and isolation', 'Unlimited bandwidth', 'Faster CPUs', 'No routing required'], 0, 'Virtual networks can be created and scaled in software while preserving isolation.'),
        q('What happens if Tenant A accidentally reaches Tenant B?', ['Virtualization is working correctly', 'Network isolation has failed', 'VXLAN is required', 'VPN encryption is missing'], 1, 'Cross-tenant reachability without authorization is an isolation failure.'),
      ],
      hard: [q('Why are virtual networks essential for public cloud providers?', ['They allow thousands of isolated customer networks to share the same physical infrastructure', 'They eliminate IP routing', 'They remove virtualization overhead', 'They replace operating systems'], 0, 'Cloud economics depend on safely multiplexing many tenants over shared hardware.')],
    },
  },
  vpns: {
    title: 'VPNs', objective: 'Build secure tunnels between users, sites, and cloud networks.',
    questions: {
      easy: [
        q('VPN stands for:', ['Virtual Private Network', 'Verified Packet Network', 'Virtual Protected Node', 'Variable Protocol Network'], 0, 'VPN stands for Virtual Private Network.'),
        q('What is the primary purpose of a VPN?', ['Secure communication over public networks', 'Faster downloads', 'Replace switches', 'Compress packets'], 0, 'VPNs protect private traffic while it crosses shared or public infrastructure.'),
        q('Which users commonly rely on VPNs?', ['Remote employees', 'Printers', 'Ethernet switches', 'Web browsers'], 0, 'Remote workers commonly use VPNs to reach private company resources.'),
      ],
      medium: [
        q('A branch office needs secure communication with headquarters across the Internet. What should be used?', ['VPN', 'VLAN', 'NAT', 'DHCP'], 0, 'A site-to-site VPN securely connects the two private networks.'),
        q('Which property does a VPN primarily provide?', ['Confidentiality through encryption', 'Faster packet forwarding', 'Broadcast reduction', 'Shorter routing paths'], 0, 'VPN encryption keeps traffic confidential across untrusted networks.'),
      ],
      hard: [q('Why might a site-to-site VPN perform slower than a private leased circuit?', ['Encryption introduces additional processing overhead', 'VPNs use less bandwidth', 'VPNs remove routing', 'VPNs bypass switches'], 0, 'Encryption and tunnel encapsulation add processing and header overhead.')],
    },
  },
  'virtual-switches': {
    title: 'Virtual Switches', objective: 'Connect VMs and enforce tenant policy in software.',
    questions: {
      easy: [
        q('A virtual switch primarily connects:', ['Virtual machines', 'Routers', 'Printers', 'Databases'], 0, 'A virtual switch connects VM interfaces to one another and to physical uplinks.'),
        q('Where does a virtual switch usually run?', ['On the virtualization host (hypervisor)', 'Inside every router', 'On client computers', 'In DNS servers'], 0, 'The hypervisor hosts the virtual switching datapath.'),
        q('Can a virtual switch support VLANs?', ['Yes', 'No'], 0, 'Modern virtual switches can tag and isolate VLAN traffic.'),
      ],
      medium: [
        q('What is a major advantage of virtual switches?', ['They provide flexible networking between virtual machines', 'They eliminate IP addressing', 'They replace controllers', 'They remove virtualization'], 0, 'Virtual switching can be configured in software for each workload.'),
        q('A VM cannot communicate with another VM on the same host. Which component should be checked first?', ['Virtual switch configuration', 'CPU temperature', 'Browser settings', 'DNS cache'], 0, 'Same-host VM traffic normally traverses the virtual switch.'),
      ],
      hard: [q('How do virtual switches support cloud scalability?', ['They allow networking to be configured entirely in software and managed automatically', 'They replace routers', 'They eliminate Ethernet', 'They remove hypervisors'], 0, 'Software-defined virtual ports and policies can be provisioned automatically at cloud scale.')],
    },
  },
  overlays: {
    title: 'Overlay Networks', objective: 'Stretch isolated tenant networks across shared routed fabrics.',
    questions: {
      easy: [
        q('What is an overlay network?', ['A virtual network built on top of another network', 'A faster Ethernet cable', 'A physical router', 'A firewall'], 0, 'An overlay creates logical connectivity over an existing underlay.'),
        q('Why are overlay networks used?', ['To create isolated virtual networks across shared infrastructure', 'To increase CPU speed', 'To remove switches', 'To replace IP addresses'], 0, 'Overlays separate tenant networks while reusing the same routed fabric.'),
        q('Which technology commonly implements Layer 2 overlays in datacenters?', ['VXLAN', 'FTP', 'SMTP', 'ARP'], 0, 'VXLAN carries Layer 2 tenant frames across a Layer 3 underlay.'),
      ],
      medium: [
        q('What problem does VXLAN solve?', ['Extending Layer 2 networks across Layer 3 infrastructure', 'Encrypting VPN traffic', 'Eliminating VLANs', 'Replacing Ethernet'], 0, 'VXLAN tunnels Layer 2 frames between tunnel endpoints over an IP network.'),
        q('Why are overlays popular in cloud environments?', ['They separate virtual network design from the physical topology', 'They reduce RAM usage', 'They eliminate switches', 'They improve monitor resolution'], 0, 'Logical networks can evolve independently of the underlay design.'),
      ],
      hard: [q('A VM migrates to another datacenter while keeping the same network configuration. Which technology most directly enables this?', ['VXLAN overlay networking', 'DHCP', 'NAT', 'Spanning Tree'], 0, 'VXLAN can stretch the VM’s logical Layer 2 segment between locations.')],
    },
  },
}
