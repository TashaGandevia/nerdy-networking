import type { ContentModule } from '@/types'

const topics = [
  ['G-L01','Program Structure','structure','Arrange function and brace blocks into a valid program.'],
  ['G-L02','Variables','variables','Declare variables and assign values.'],
  ['G-L03','Expressions & Operators','operators','Combine values with arithmetic operators.'],
  ['G-L04','Comparisons','comparisons','Build boolean comparisons such as >= and ==.'],
  ['G-L05','If Statements','if','Control program flow with conditions.'],
  ['G-L06','Else Branches','else','Build complete two-way decisions.'],
  ['G-L07','Nested Logic','nested','Combine multiple conditions safely.'],
  ['G-L08','Loops','loops','Repeat actions with visual loop blocks.'],
  ['G-L09','Functions','functions','Create reusable functions with parameters and return values.'],
  ['G-L10','Arrays','arrays','Traverse and transform ordered collections.'],
  ['G-L11','Objects','objects','Create structured values with named properties.'],
  ['G-L12','Mini Algorithms','algorithms','Assemble a complete factorial algorithm.'],
  ['G-L13','Endless Practice','endless','Practice generated block-programming challenges without limits.'],
] as const

export const moduleG: ContentModule = {
  id: 'G', title: 'Coding Practice', sourceDeck: 'Interactive Code Builder Curriculum',
  description: 'Learn program structure with drag-and-drop blocks, automatic indentation, AST validation, and a fake console.',
  accentClass: 'text-module-g', mechanics: ['codeBuilder'],
  flashcards: [
    { id:'G-01',type:'term-definition',front:'What is control flow?',back:'The order in which program statements execute, including branches, loops, and function calls.',tags:['G','programming','control-flow'] },
    { id:'G-02',type:'term-definition',front:'What does a return statement do?',back:'It ends a function call and sends a value back to the caller.',tags:['G','programming','functions'] },
  ],
  levels: topics.map(([id,title,codingTopic,intent],index)=>({
    id,title,intent,mechanic:'codeBuilder' as const,setup:{codingTopic},
    winCondition:'The block program matches the expected structure and produces the correct console output.',
    difficulty: (Math.min(5,Math.floor(index/3)+1) as 1|2|3|4|5),isBoss:id==='G-L12',
  })),
}
