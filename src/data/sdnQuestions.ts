export type SdnDifficulty = 'easy' | 'medium' | 'hard'

export type SdnGameId =
  | 'growth'
  | 'packet-detective'
  | 'header-match'
  | 'flow-builder'
  | 'controller-dashboard'
  | 'wildcard'
  | 'traffic-engineering'
  | 'build-controller'
  | 'policy-builder'
  | 'packet-race'

export interface SdnQuestion {
  prompt: string
  context?: string[]
  options: string[]
  answer: number
  explanation: string
}

export interface SdnGameQuestions {
  title: string
  subtitle: string
  questions: Record<SdnDifficulty, SdnQuestion[]>
}

const q = (prompt: string, options: string[], answer: number, explanation: string, context?: string[]): SdnQuestion => ({ prompt, options, answer, explanation, context })

export const SDN_GAME_ORDER: SdnGameId[] = [
  'growth', 'packet-detective', 'header-match', 'flow-builder', 'controller-dashboard',
  'wildcard', 'traffic-engineering', 'build-controller', 'policy-builder', 'packet-race',
]

export const SDN_QUESTION_BANK: Record<SdnGameId, SdnGameQuestions> = {
  growth: {
    title: 'Network Growth Simulator',
    subtitle: 'Experience why manual network operations stop scaling.',
    questions: {
      easy: [
        q('Your company grows from 5 computers to 500. Every router is configured manually. What is the biggest problem?', ['Routers are too slow', "Manual configuration doesn't scale", 'Ethernet stops working', 'Packets become too large'], 1, 'The forwarding hardware may still be fast, but coordinating hundreds of manual configurations becomes unmanageable.'),
        q('You need to change a routing policy across 150 routers. Which architecture makes this easiest?', ['Traditional distributed routing', 'SDN centralized controller', 'One giant router', 'More cables'], 1, 'A controller provides one logical point for expressing and distributing policy.'),
      ],
      medium: [
        q('A new branch office is added. Every router must learn the new network individually. Which networking model is this?', ['SDN', 'Distributed Control Plane', 'Programmable Data Plane', 'OpenFlow'], 1, 'In a distributed control plane, each router participates in learning and computing network state.'),
        q('Engineers spend most of their time updating device configurations as the network grows. What problem is SDN designed to solve?', ['Slow packet forwarding', 'Network management complexity', 'Ethernet collisions', 'TCP congestion'], 1, 'SDN introduces abstractions and centralized control to reduce operational complexity.'),
      ],
      hard: [
        q('Network A requires configuration on every switch. Network B needs one controller change. Which SDN property is demonstrated?', ['Match-Action', 'Centralized Control', 'Layer 2 Switching', 'NAT'], 1, 'Logically centralized control lets one policy change be translated into many device updates.'),
        q('A traditional and an SDN network both double in size. Which statement is most accurate?', ['Both require identical management effort', 'SDN reduces operational complexity through centralized management', 'Traditional routing becomes centralized', 'Switches become programmable automatically'], 1, 'Centralized management and network-wide abstractions reduce repeated per-device work.'),
      ],
    },
  },
  'packet-detective': {
    title: 'Packet Detective',
    subtitle: 'Inspect packet headers and predict the matching flow entry.',
    questions: {
      easy: [
        q('A packet matches Destination IP = 51.6.0.8. The rule action is Forward Port 6. What happens?', ['Forward to Port 6', 'Drop', 'Send to Controller', 'Flood all ports'], 0, 'The destination field matches exactly, so the switch executes the rule action.', ['Packet · dst IP 51.6.0.8', 'Rule · dst IP 51.6.0.8 → Port 6']),
        q('A packet has TCP destination port 22. The firewall matches port 22 with action Drop. What is the result?', ['Forward normally', 'Packet is dropped', 'Rewrite the port', 'No rule matches'], 1, 'SSH uses TCP destination port 22, so this packet matches the drop rule.', ['Packet · TCP dst 22', 'Rule · TCP dst 22 → Drop']),
      ],
      medium: [
        q('The packet source is 192.168.1.5, but the only rule matches source 10.0.0.2. What happens?', ['Rule matches', 'Rule does not match', 'Packet is rewritten', 'Both sources match'], 1, 'The source addresses differ, so the rule cannot apply.', ['Packet · src 192.168.1.5 · dst 10.0.0.4', 'Rule · src 10.0.0.2']),
        q('Rule 1 matches destination port 80. Rule 2 matches port 443. An incoming packet has destination port 443. Which rule matches?', ['Rule 1', 'Rule 2', 'Both rules', 'Neither rule'], 1, 'The packet header equals Rule 2’s match value.'),
      ],
      hard: [
        q('A packet matches both Rule A: port 22 → Drop and Rule B: destination IP → Forward. Rule A has higher priority. What executes?', ['Forward using Rule B', 'Drop using Rule A', 'Execute both', 'Send to Controller'], 1, 'When rules overlap, the highest-priority matching rule executes.'),
        q('A packet from 128.19.1.1 to port 22 matches a high-priority source drop rule and a lower-priority port forward rule. Result?', ['Forward', 'Packet dropped', 'Random choice', 'Rewrite source'], 1, 'The higher-priority source rule wins and drops the packet.'),
      ],
    },
  },
  'header-match': {
    title: 'Header Match Challenge',
    subtitle: 'Identify the header field that expresses each policy.',
    questions: {
      easy: [
        q('Which field identifies where an IP packet is going?', ['Source IP', 'Destination IP', 'Source MAC', 'VLAN ID'], 1, 'The destination IP identifies the packet’s network-layer destination.'),
        q('Which field is normally used to identify SSH service traffic?', ['TCP Destination Port 22', 'Source IP', 'EtherType', 'VLAN ID'], 0, 'SSH servers normally listen on TCP destination port 22.'),
      ],
      medium: [
        q('Which layer contains the TCP Destination Port?', ['Link', 'Network', 'Transport', 'Application'], 2, 'TCP is a transport-layer protocol, so its port fields belong to the transport header.'),
        q('Which IP header field identifies the sender?', ['Destination IP', 'Source IP', 'Protocol', 'TTL'], 1, 'The source IP identifies the network-layer sender.'),
      ],
      hard: [
        q('A firewall must block HTTPS traffic. Which field is most important?', ['Destination Port = 443', 'Source Port = 443', 'EtherType = IPv4', 'Destination MAC'], 0, 'HTTPS servers conventionally use TCP destination port 443.'),
        q('Generalized forwarding allows a switch to match using:', ['Destination IP only', 'Any supported header fields', 'MAC addresses only', 'TCP fields only'], 1, 'Generalized match-action pipelines can use supported fields across several protocol layers.'),
      ],
    },
  },
  'flow-builder': {
    title: 'Flow Rule Builder',
    subtitle: 'Translate a network mission into a complete match-action rule.',
    questions: {
      easy: [
        q('The mission is to forward traffic to Port 4. Which action should the rule use?', ['Forward(4)', 'Drop', 'Send to Controller', 'Modify VLAN'], 0, 'Forward(4) sends matching packets out switch port 4.'),
        q('The mission is to block SSH. Which action should the matching rule use?', ['Forward', 'Drop', 'Flood', 'Modify'], 1, 'A firewall blocks matching traffic with the Drop action.'),
      ],
      medium: [
        q('You must forward packets destined to 10.0.0.15. What is the correct match?', ['Source IP = 10.0.0.15', 'Destination IP = 10.0.0.15', 'TCP Port = 15', 'Destination MAC = 15'], 1, 'Destination-based forwarding matches the destination IP.'),
        q('You must block packets originating from 128.19.1.1. What is the correct match?', ['Destination IP = 128.19.1.1', 'Source IP = 128.19.1.1', 'TCP Port = 128', 'Any source'], 1, 'Traffic origin is represented by the source IP field.'),
      ],
      hard: [
        q('You must forward HTTPS traffic. Which match identifies the service?', ['TCP Destination Port = 443', 'TCP Source Port = 443', 'IP Protocol = 443', 'VLAN = 443'], 0, 'HTTPS requests target TCP destination port 443.'),
        q('You must redirect DNS traffic to the controller. Which rule is correct?', ['TCP dst 22 → Drop', 'UDP dst 53 → Send to Controller', 'IP dst 53 → Forward', 'UDP src 53 → Drop'], 1, 'DNS queries commonly target UDP destination port 53; the requested action punts them to the controller.'),
      ],
    },
  },
  'controller-dashboard': {
    title: 'Controller Dashboard',
    subtitle: 'Operate the network OS and its control applications.',
    questions: {
      easy: [
        q('A switch reports that a new host connected. Who receives the notification?', ['Every host', 'Controller', 'Load balancer', 'DNS server'], 1, 'The switch reports events to the controller over the southbound interface.'),
        q('A routing application needs the network topology. Who provides it?', ['Controller', 'Individual packet', 'Ethernet cable', 'End host'], 0, 'The controller’s network state service maintains the topology abstraction.'),
      ],
      medium: [
        q('A link fails. Which component computes and installs replacement flow rules?', ['Source host', 'Controller', 'Failed cable', 'Application server'], 1, 'The controller recomputes affected paths and programs the switches.'),
        q('Which API category connects the controller to switches?', ['Northbound API', 'Southbound API', 'Application API', 'User API'], 1, 'Southbound APIs such as OpenFlow program and receive events from switches.'),
      ],
      hard: [
        q('A load-balancer application requests current network state. Which controller service provides it?', ['Packet parser', 'Network State Management', 'Ethernet driver', 'Host operating system'], 1, 'Network State Management maintains shared topology and telemetry for applications.'),
        q('A routing application requests topology from the controller through which interface?', ['Southbound API', 'Northbound API', 'Data-plane port', 'Transport header'], 1, 'Applications consume controller services through northbound APIs.'),
      ],
    },
  },
  wildcard: {
    title: 'Wildcard Puzzle',
    subtitle: 'Compress flow tables without changing packet behavior.',
    questions: {
      easy: [
        q('Four destination IP rules all forward to Port 3. What is the best optimization?', ['Add four more rules', 'Use a wildcard rule', 'Drop all traffic', 'Disable priority'], 1, 'A wildcard can combine equivalent matches that share one action.'),
        q('In a flow-table match, wildcard “*” means:', ['Match nothing', 'Match anything', 'Highest priority', 'Drop'], 1, 'An asterisk represents any value for that field.'),
      ],
      medium: [
        q('You have 20 identical forwarding rules. How can you reduce them?', ['Increase priority', 'Merge using masks or wildcards', 'Duplicate the table', 'Add controllers'], 1, 'Masks and wildcards aggregate many equivalent entries.'),
        q('A simplified mask 00001111 ignores which portion of the compared value?', ['Left bits', 'Right bits', 'Every bit', 'No bits'], 0, 'In this puzzle notation, zeroed left positions are ignored.'),
      ],
      hard: [
        q('Two rules differ only in the final address bit and have the same action. Best optimization?', ['Merge into one masked rule', 'Add a third exact rule', 'Remove both rules', 'Raise both priorities'], 0, 'A mask can ignore the differing bit while retaining the shared prefix.'),
        q('Why are fewer equivalent flow rules beneficial?', ['Larger packets', 'Reduced TCAM usage and simpler tables', 'More broadcast traffic', 'Slower matching'], 1, 'TCAM is scarce and power-intensive; compact tables are easier to manage.'),
      ],
    },
  },
  'traffic-engineering': {
    title: 'Traffic Engineering',
    subtitle: 'Steer flows using global latency, capacity, and congestion state.',
    questions: {
      easy: [
        q('One network link is overloaded. What is the best controller action?', ['Reroute traffic', 'Increase packet size', 'Disable Ethernet', 'Remove all rules'], 0, 'Moving selected flows to spare paths relieves the hot link.'),
        q('The controller detects congestion. Who decides the new path?', ['Controller', 'Ethernet frame', 'Destination host', 'Failed switch port'], 0, 'The controller uses network-wide state to choose and install a path.'),
      ],
      medium: [
        q('Two equal paths exist and one becomes congested. What should the controller do?', ['Keep all traffic on it', 'Shift traffic to the alternate path', 'Drop every flow', 'Remove the alternate path'], 1, 'Traffic engineering uses available capacity rather than blindly retaining one route.'),
        q('Why is the shortest path not always the best path?', ['It may be congested', 'It has no switches', 'It cannot carry IP', 'It always fails'], 0, 'A slightly longer path may provide much more available capacity.'),
      ],
      hard: [
        q('Link A is 5 ms at 95% utilization. Link B is 8 ms at 20%. Which is the better new route?', ['Link A', 'Link B', 'Use neither', 'They are identical'], 1, 'Link B trades 3 ms of latency for far more available capacity and lower queueing risk.'),
        q('Traffic engineering primarily optimizes:', ['Overall network performance', 'Ethernet frame size', 'Hostnames', 'Cable color'], 0, 'Traffic engineering balances network-wide objectives such as utilization, latency, and policy.'),
      ],
    },
  },
  'build-controller': {
    title: 'Build the Controller',
    subtitle: 'Assemble applications, APIs, state services, and switches.',
    questions: {
      easy: [
        q('Which control component sits directly above the switches?', ['Controller', 'Application payload', 'End user', 'TCP port'], 0, 'The controller programs and receives events from the switch layer.'),
        q('Network applications connect to which component?', ['Controller', 'Individual cable', 'Packet payload', 'NIC queue'], 0, 'Applications use controller abstractions instead of configuring switches directly.'),
      ],
      medium: [
        q('Which API connects applications to the controller?', ['Northbound API', 'Southbound API', 'Ethernet API', 'Transport API'], 0, 'Northbound APIs expose controller services and abstractions to applications.'),
        q('Which API connects the controller to switches?', ['Northbound API', 'Southbound API', 'Browser API', 'Application API'], 1, 'Southbound APIs program forwarding devices.'),
      ],
      hard: [
        q('Which controller layer stores the topology abstraction?', ['Network State Management', 'Packet payload', 'Physical link', 'TCP application'], 0, 'Network State Management maintains the controller’s model of nodes, links, and events.'),
        q('REST APIs exposed by an SDN controller are typically:', ['Northbound APIs', 'Southbound APIs', 'Data-plane rules', 'Ethernet headers'], 0, 'REST is commonly used to expose controller capabilities to applications.'),
      ],
    },
  },
  'policy-builder': {
    title: 'Policy Builder',
    subtitle: 'Translate company access requirements into enforceable rules.',
    questions: {
      easy: [
        q('Guests should never reach the database. What action should their matching rule use?', ['Forward', 'Drop', 'Rewrite', 'Flood'], 1, 'A deny policy is enforced by dropping matching guest-to-database traffic.'),
        q('Employees are allowed to access the database. What action should their rule use?', ['Drop', 'Forward', 'Mirror only', 'Remove header'], 1, 'Allowed traffic is forwarded toward the database.'),
      ],
      medium: [
        q('Guests may access the web server but not the database. What is the best solution?', ['One rule for everything', 'Two separate flow rules', 'No rules', 'Disable the guests'], 1, 'Different destinations require separate allow and deny behavior.'),
        q('Only Finance may access Payroll. What should the rule match?', ['Destination server only', 'Source subnet/group plus destination server', 'TCP source port only', 'Any source'], 1, 'The policy depends on both the requester identity/group and protected destination.'),
      ],
      hard: [
        q('Employees may SSH; guests may only browse HTTP. How should this be represented?', ['One wildcard allow', 'Multiple rules for different traffic classes', 'One drop-all rule only', 'No priorities'], 1, 'Each user class and service combination requires distinct match-action behavior.'),
        q('The database accepts HTTPS only from the application server. What is the correct match?', ['Destination port only', 'Source IP + Destination IP + TCP Port 443', 'Source MAC only', 'Any HTTPS packet'], 1, 'The precise policy constrains source, destination, and application service together.'),
      ],
    },
  },
  'packet-race': {
    title: 'Packet Race',
    subtitle: 'Predict simultaneous packet outcomes, priorities, and paths.',
    questions: {
      easy: [
        q('Three packets arrive, but only one has destination port 80. Which packet matches the HTTP rule?', ['SSH packet', 'HTTP packet', 'DNS packet', 'All packets'], 1, 'HTTP traffic targets destination port 80 in this simulation.'),
        q('A packet matches no installed rule. Where does it go in this game mode?', ['Controller/default processing', 'Always Port 1', 'The fastest host', 'Every database'], 0, 'A table miss is handled by the configured default, commonly sending the packet to the controller.'),
      ],
      medium: [
        q('Two packets arrive and only one matches a firewall drop rule. Which packet is dropped?', ['The matching packet', 'The other packet', 'Both packets', 'Neither packet'], 0, 'Only traffic satisfying the rule’s match fields executes its Drop action.'),
        q('A packet’s highest-priority match is Rule 3. How do you predict its destination?', ['Follow Rule 1', 'Follow Rule 3’s action', 'Always drop it', 'Ignore the table'], 1, 'The action of the selected matching entry determines the packet outcome.'),
      ],
      hard: [
        q('A packet matches three entries. Which one executes?', ['Lowest priority', 'Highest priority', 'All simultaneously', 'Newest rule'], 1, 'Flow tables resolve overlapping matches using priority.'),
        q('Replay shows one packet rewritten, one forwarded, and one dropped. Which evidence identifies the rewritten packet?', ['Its header value changes along the path', 'It disappears immediately', 'It exits unchanged', 'Its cable becomes shorter'], 0, 'A modify action is visible as a header change while the packet continues through the network.'),
      ],
    },
  },
}
