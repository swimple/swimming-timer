export interface Swimmer {
  name: string
  club?: string
  year?: string
  heat: number
  lane: number
}

export interface Heat {
  number: number
  swimmers: Swimmer[]
}

export interface Competition {
  name: string
  heats: Heat[]
  currentHeat: number
}

export interface Result {
  lane: string
  name: string
  club?: string
  heat: number
  year?: string
  time: number
}
