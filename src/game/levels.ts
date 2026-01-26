// src/game/levels.ts
// Level definitions for the Electron puzzle game

// 0 - void
// 1 - vertical lane
// 2 - corner up-right
// 3 - corner right-down
// 4 - corner down-left
// 5 - corner left-up 
// 6 - horizontal lane
// + - Cross lane (for level 10) 

// 7 - start
// 8 - data
// 9 - empty data

// A..Z - teleports ( pairs: A->B, B->C, ... Z->A )




import { Level } from './types'

export const levels: Level[] = [
  {
    name: 'Level 1',
    allowedActionsCount: 5,
    maxData: 1,
    maxActions: 7,
    layout: [
       
      '00100',
      '00900',
      '00100',
      '00100',
      '00800',
      '00100',
      '00700'
    ]
  },
  {
    name: 'Level 2',
    allowedActionsCount: 6,
    maxActions: 7,
    maxData: 2,
    layout: [
      '00100',
      '00100',
      '00900',
      '00800',
      '00900',
      '00800',
      '00700'
    ]
  },
  {
    name: 'Level 3',
    allowedActionsCount: 7,
    maxData: 2,
    maxActions: 7,
    layout: [
      '0000010',
      '0008690',
      '0001000',
      '0869000',
      '0100000',
      '0700000'
    ]
  },
  {
    name: 'Level 4',
    allowedActionsCount: 7,
    maxActions: 7,
    maxData: 1,
    layout: [
    '08666690',
    '01000000',
    '01000000',
    '01000000',
    '01000000',
    '07000000'
    ]
  },
  {
    name: 'Level 5',
    allowedActionsCount: 7,
    maxActions: 7,
    maxData: 2,
    layout: [
    '08666690',
    '01000010',
    '01000010',
    '01000010',
    '01096680',
    '07000000'
    ]
  },
  {
    name: 'Level 6',
    allowedActionsCount: 7,
    maxActions: 7,
    maxData: 10,
    layout: [
    '0ACEG00',
    '0999990',
    '0888880',
    '0999990',
    '0888880',
    '07BDFH0'
    ]
  },
  {
    name: 'Level 7',
    allowedActionsCount: 7,
    maxActions: 7,
    maxData: 2,
    layout: [
    '0G000D0',
    'F90008E',
    '0000000',
    '0000000',
    'A80009B',
    '07000C0'
    ]
  },{
    name: 'Level 8',
    allowedActionsCount: 7,
    maxActions: 7,
    maxData: 1,
    layout: [
    '00000I',
    '900008',
    'J0000H',
    '000000',
    'GE4CA4',
    '5FD5B7'
    ]
  },{
    name: 'Level 9',
    allowedActionsCount: 7,
    maxActions: 8,
    maxData: 1,
    layout: [
    '266664',
    '126641',
    '112411',
    '117811',
    '156311',
    '566639'
    
    ]
  },{
    name: 'Level 10',
    allowedActionsCount: 7,
    maxActions: 7,
    maxData: 1,
    layout: [
    'B000A40B09',
    '1000010101',
    '1000010801',
    '86666+6663',
    '0E00070F00',
    '0100010900',
    '0D00010100',
    '00000C0000',
    ]
  }
]

