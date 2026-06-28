import type { SdnDifficulty } from './sdnQuestions'

export type P4TopicId = 'networking-problem' | 'abstractions' | 'forwarding' | 'match-action' | 'flow-tables' | 'network-os'

export interface P4Question {
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export interface P4Topic {
  title: string
  pipelineStage: string
  questions: Record<SdnDifficulty, P4Question[]>
}

const q = (prompt: string, options: string[], answer: number, explanation: string): P4Question => ({ prompt, options, answer, explanation })

export const P4_TOPIC_ORDER: P4TopicId[] = ['networking-problem', 'abstractions', 'forwarding', 'match-action', 'flow-tables', 'network-os']

export const P4_QUESTION_BANK: Record<P4TopicId, P4Topic> = {
  'networking-problem': {
    title: 'The Networking Problem', pipelineStage: 'Why program the dataplane?',
    questions: {
      easy: [
        q('What is the primary purpose of a computer network?', ['Store files', 'Allow devices to communicate', 'Increase CPU speed', 'Encrypt data'], 1, 'Networks connect devices so they can exchange information.'),
        q('As a network grows, what usually becomes more difficult?', ['Sending packets', 'Managing network devices', 'Connecting any cable', 'Using Ethernet'], 1, 'Operational coordination and consistent configuration become harder as device count grows.'),
        q('Which device typically forwards packets between networks?', ['Switch', 'Router', 'Firewall', 'Server'], 1, 'A router forwards packets between IP networks.'),
      ],
      medium: [
        q('A company has 300 routers that each need manual configuration after a policy change. What problem does this demonstrate?', ['Packet loss', 'Scalability of management', 'TCP congestion', 'Routing loops'], 1, 'Repeated per-device changes expose the management scalability problem.'),
        q('Why do large traditional networks become difficult to manage?', ['Packets become larger', 'Each device maintains its own control logic', 'Ethernet stops scaling', 'Switches become slower'], 1, 'Distributed logic and configuration must remain consistent across many independent devices.'),
        q('Which approach allows administrators to configure policy from one logical location?', ['Distributed routing', 'Centralized SDN controller', 'Static routing', 'VLANs'], 1, 'An SDN controller centralizes policy intent and distributes device rules.'),
      ],
      hard: [
        q('A network doubles in size without changing its management architecture. Which aspect typically increases fastest?', ['Packet speed', 'Configuration complexity', 'CPU frequency', 'Ethernet bandwidth'], 1, 'Interactions and repeated device configuration make operational complexity grow quickly.'),
        q('What is the fundamental motivation behind SDN?', ['Faster switches', 'Easier centralized network management', 'Better Ethernet cables', 'More IP addresses'], 1, 'SDN separates control from forwarding and provides centralized abstractions for management.'),
        q('Which statement best describes the challenge of traditional networking?', ['Forwarding packets is difficult', 'Managing distributed control logic becomes increasingly complex', 'Routers cannot communicate', 'TCP no longer functions'], 1, 'The hard part is coordinating distributed control and policy, not basic packet movement.'),
      ],
    },
  },
  abstractions: {
    title: 'Network Abstractions', pipelineStage: 'Headers entering the parser',
    questions: {
      easy: [
        q('Which protocol provides logical addressing?', ['Ethernet', 'IP', 'HTTP', 'USB'], 1, 'IP addresses identify endpoints across interconnected networks.'),
        q('Which layer moves data between applications?', ['Physical', 'Transport', 'Data Link', 'Network Interface'], 1, 'Transport protocols such as TCP and UDP provide application-to-application delivery.'),
        q('What is contained inside a packet?', ['Headers and payload', 'Only IP addresses', 'Only user data', 'Only Ethernet frames'], 0, 'Headers carry protocol metadata while the payload carries encapsulated data.'),
      ],
      medium: [
        q('Which header is examined first when a packet arrives on an Ethernet network?', ['TCP', 'Ethernet', 'HTTP', 'IP'], 1, 'The outer Ethernet header is parsed before its encapsulated network and transport headers.'),
        q('What does a network topology represent?', ['Packet size', 'Device connectivity', 'CPU usage', 'Flow tables'], 1, 'A topology models network nodes and the links connecting them.'),
        q('Which header field identifies the destination application?', ['Source MAC', 'Destination Port', 'Destination MAC', 'VLAN ID'], 1, 'The transport destination port identifies the receiving service.'),
      ],
      hard: [
        q('A packet is encapsulated before Ethernet transmission. Which header is added last?', ['TCP', 'IP', 'Ethernet', 'Application'], 2, 'Ethernet is the outermost header on the local link and is added after IP and transport encapsulation.'),
        q('Which abstraction lets routing algorithms ignore physical cable placement?', ['Packet forwarding', 'Network graph/topology abstraction', 'Ethernet switching', 'TCP segmentation'], 1, 'Routing operates on a graph model rather than raw physical layout details.'),
        q('Which layer primarily determines a packet path across multiple networks?', ['Application', 'Transport', 'Network (IP)', 'Physical'], 2, 'Network-layer forwarding uses logical addresses to select inter-network paths.'),
      ],
    },
  },
  forwarding: {
    title: 'Data Plane Forwarding', pipelineStage: 'Ingress forwarding decision',
    questions: {
      easy: [
        q('What is forwarding?', ['Sending a packet to the next destination', 'Creating packets', 'Encrypting packets', 'Compressing packets'], 0, 'Forwarding moves a packet toward its next hop or destination.'),
        q('Which device performs packet forwarding?', ['Switch', 'Database', 'Printer', 'Browser'], 0, 'Switches execute data-plane forwarding behavior.'),
        q('Forwarding decisions are based on:', ['Flow rules', 'CPU speed', 'Screen resolution', 'RAM'], 0, 'The data plane applies installed rules to packet headers.'),
      ],
      medium: [
        q('A packet matches a rule for destination 10.0.0.5. What happens next?', ['Drop automatically', "Execute the rule's action", 'Restart the switch', 'Send every packet to the controller'], 1, 'A successful match triggers its associated action.'),
        q('If no matching forwarding rule exists, what commonly happens in SDN?', ['Packet is duplicated', 'Packet is sent to the controller', 'Packet is encrypted', 'Switch shuts down'], 1, 'A table-miss action commonly punts the packet to the controller.'),
        q('Which action sends a packet out a specific interface?', ['Match', 'Forward', 'Parse', 'Drop'], 1, 'The forward action selects an egress interface.'),
      ],
      hard: [
        q('Why implement forwarding decisions in hardware whenever possible?', ['Lower latency and higher throughput', 'Better security', 'Easier programming', 'Smaller packets'], 0, 'Hardware pipelines sustain line-rate processing with predictable latency.'),
        q('Forwarding belongs primarily to which plane?', ['Control Plane', 'Data Plane', 'Management Plane', 'Application Plane'], 1, 'The data plane executes existing rules on packets.'),
        q('Which statement best describes forwarding?', ['Deciding network policies', 'Executing existing forwarding rules on packets', 'Running routing protocols', 'Managing applications'], 1, 'Forwarding applies previously programmed behavior rather than computing policy.'),
      ],
    },
  },
  'match-action': {
    title: 'Match-Action Programming', pipelineStage: 'Programmable ingress tables',
    questions: {
      easy: [
        q('A Match-Action rule contains:', ['Match conditions and an action', 'Two IP addresses', 'MAC addresses only', 'Routing tables'], 0, 'A rule selects packets by fields and then performs behavior.'),
        q('Which action blocks traffic?', ['Forward', 'Drop', 'Parse', 'Inspect'], 1, 'Drop discards the matching packet.'),
        q('Which field could be matched?', ['Destination IP', 'Monitor brightness', 'CPU model', 'RAM size'], 0, 'Destination IP is a packet header field exposed to match-action tables.'),
      ],
      medium: [
        q('A firewall blocks SSH traffic. Which field is most important?', ['TCP Destination Port 22', 'Ethernet source only', 'TTL = 1', 'Packet length'], 0, 'SSH service traffic conventionally targets TCP destination port 22.'),
        q('Which action redirects packets to the control plane?', ['Drop', 'Send to Controller', 'Deparse', 'Forward all'], 1, 'A punt or send-to-controller action transfers selected packets to control software.'),
        q('Which packet fields can modern programmable switches match?', ['Destination IP only', 'Multiple protocol header fields', 'MAC only', 'TCP only'], 1, 'Programmable pipelines expose fields from several parsed protocols.'),
      ],
      hard: [
        q('Two table entries match the same packet. Which executes?', ['Lowest priority rule', 'Highest priority rule', 'Both simultaneously', 'Newest rule'], 1, 'Priority resolves overlapping matches.'),
        q('Why are rule priorities necessary?', ['To resolve overlapping rules', 'To enlarge packets', 'To add cables', 'To slow the parser'], 0, 'Priority makes overlapping policy deterministic.'),
        q('What makes Match-Action more flexible than traditional destination routing?', ['It uses no headers', 'It can match many header fields, not only destination addresses', 'It always floods', 'It removes actions'], 1, 'General match-action behavior can express routing, firewalling, telemetry, and transformations.'),
      ],
    },
  },
  'flow-tables': {
    title: 'Flow Tables & TCAM', pipelineStage: 'Table lookup and optimization',
    questions: {
      easy: [
        q('Where are flow rules stored?', ['Inside the switch flow table', 'Inside packet payloads', 'In Ethernet cables', 'Only on hosts'], 0, 'Switch tables hold entries used by the forwarding pipeline.'),
        q('Who installs flow rules?', ['Controller', 'Packet payload', 'End user browser', 'Physical link'], 0, 'The controller programs switch tables through a southbound interface.'),
        q('What happens when a flow table contains a matching rule?', ['The corresponding action executes', 'The switch restarts', 'The packet grows', 'The controller disconnects'], 0, 'The selected entry invokes its action.'),
      ],
      medium: [
        q('Why combine multiple similar rules?', ['Reduce flow table size', 'Increase packet length', 'Disable priority', 'Add latency'], 0, 'Aggregation conserves table entries while preserving equivalent behavior.'),
        q('What does a wildcard do?', ['Matches multiple values', 'Matches no values', 'Deletes the table', 'Changes the payload'], 0, 'Wildcards allow one entry to cover a set of field values.'),
        q('Why are efficient flow tables important?', ['Hardware memory is limited', 'Packets need colors', 'Links require names', 'Controllers have no storage'], 0, 'High-speed lookup memory is finite.'),
      ],
      hard: [
        q('Why is TCAM a valuable resource?', ['It is fast but limited and expensive', 'It is unlimited', 'It stores payload files', 'It replaces the controller'], 0, 'TCAM provides fast parallel wildcard matching but consumes significant area and power.'),
        q('Which optimization reduces TCAM usage?', ['Merge similar rules using wildcards', 'Duplicate every rule', 'Add larger payloads', 'Remove priorities only'], 0, 'Aggregating compatible entries reduces the number of hardware slots.'),
        q('Why should frequently matched rules remain in hardware?', ['Maintain line-rate forwarding performance', 'Increase controller load', 'Make packets larger', 'Avoid parsing'], 0, 'Hardware lookup avoids a slow control-plane round trip for common traffic.'),
      ],
    },
  },
  'network-os': {
    title: 'Network OS & P4 Control', pipelineStage: 'Control-plane programming',
    questions: {
      easy: [
        q('What is the primary purpose of the Network Operating System?', ['Manage the network centrally', 'Increase payload size', 'Replace Ethernet', 'Render websites'], 0, 'The network OS provides centralized state and services for control applications.'),
        q('Where do SDN applications execute?', ['On the controller', 'Inside every payload', 'On physical cables', 'Only on clients'], 0, 'Control applications run above the controller platform.'),
        q('Who communicates directly with programmable switches?', ['Controller', 'Application payload', 'Printer', 'DNS name'], 0, 'The controller programs switches and receives device events.'),
      ],
      medium: [
        q('Which API connects applications to the controller?', ['Northbound API', 'Southbound API', 'Ethernet API', 'Parser API'], 0, 'Applications consume controller services through northbound interfaces.'),
        q('Which API connects controllers to switches?', ['Northbound API', 'Southbound API', 'Browser API', 'Payload API'], 1, 'Southbound interfaces program the data plane.'),
        q('Which service maintains current topology knowledge?', ['Network State Management', 'Packet deparser', 'Physical cable', 'TCP payload'], 0, 'Shared network state tracks nodes, links, events, and telemetry.'),
      ],
      hard: [
        q('Why is the controller called a network operating system?', ['It provides common services and abstractions for network applications', 'It is a desktop OS', 'It only parses packets', 'It replaces all links'], 0, 'Like an OS, it mediates hardware resources and offers reusable abstractions.'),
        q('Why do SDN applications share the same network state?', ['To make consistent decisions from a common view', 'To duplicate work', 'To enlarge packets', 'To avoid topology'], 0, 'A shared view reduces inconsistency and duplicated discovery logic.'),
        q('Routing and firewall apps both need topology. Why is the shared-controller architecture beneficial?', ['It prevents duplication and provides a consistent global view', 'It removes all policy', 'It disables forwarding', 'It hides every switch'], 0, 'Common controller services give all applications synchronized state and reusable abstractions.'),
      ],
    },
  },
}
