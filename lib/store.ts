import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit"

// Types
interface BoothPerson {
  id: string
  name: string
  phone: string
  address: string
  customerVPAs: Array<{
    id: string
    vpa: string
    isDefault: boolean
    isDisabled: boolean
    createdAt: string
  }>
  createdAt: string
}

interface Transaction {
  sno: string
  transactionDate: string
  transactionAmount: number
  rrn: string
  customerVPA: string
  isMatched?: boolean
  matchedPersonId?: string
}

interface AppState {
  boothPeople: BoothPerson[]
  transactions: Transaction[]
  uploadedFile: string | null
}

const initialState: AppState = {
  boothPeople: [],
  transactions: [],
  uploadedFile: null,
}

// Slice
const appSlice = createSlice({
  name: "app",
  initialState: initialState,
  reducers: {
    addBoothPerson: (state, action: PayloadAction<Omit<BoothPerson, "id" | "createdAt">>) => {
      const newPerson: BoothPerson = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }
      state.boothPeople.push(newPerson)
      saveStateToStorage(state)
    },
    updateBoothPerson: (state, action: PayloadAction<BoothPerson>) => {
      const index = state.boothPeople.findIndex((p) => p.id === action.payload.id)
      if (index !== -1) {
        state.boothPeople[index] = action.payload
        saveStateToStorage(state)
      }
    },
    deleteBoothPerson: (state, action: PayloadAction<string>) => {
      state.boothPeople = state.boothPeople.filter((p) => p.id !== action.payload)
      saveStateToStorage(state)
    },
    addVPAToPerson: (state, action: PayloadAction<{ personId: string; vpa: string }>) => {
      const person = state.boothPeople.find((p) => p.id === action.payload.personId)
      if (person) {
        // Disable all existing VPAs
        person.customerVPAs.forEach((vpa) => {
          vpa.isDefault = false
          vpa.isDisabled = true
        })
        // Add new VPA as default
        person.customerVPAs.push({
          id: Date.now().toString(),
          vpa: action.payload.vpa,
          isDefault: true,
          isDisabled: false,
          createdAt: new Date().toISOString(),
        })
        saveStateToStorage(state)
      }
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload
      saveStateToStorage(state)
    },
    setUploadedFile: (state, action: PayloadAction<string>) => {
      state.uploadedFile = action.payload
      saveStateToStorage(state)
    },
    matchTransaction: (state, action: PayloadAction<{ transactionIndex: number; personId: string }>) => {
      const transaction = state.transactions[action.payload.transactionIndex]
      if (transaction) {
        transaction.isMatched = true
        transaction.matchedPersonId = action.payload.personId
        saveStateToStorage(state)
      }
    },
    loadStateFromStorage: (state) => {
      const loadedState = loadStateFromStorage()
      return loadedState
    },
  },
})

const loadStateFromStorage = (): AppState => {
  if (typeof window !== "undefined") {
    try {
      const savedState = localStorage.getItem("booth-payment-app-state")
      if (savedState) {
        return JSON.parse(savedState)
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error)
    }
  }
  return initialState
}

const saveStateToStorage = (state: AppState) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("booth-payment-app-state", JSON.stringify(state))
    } catch (error) {
      console.error("Error saving state to localStorage:", error)
    }
  }
}

export const {
  addBoothPerson,
  updateBoothPerson,
  deleteBoothPerson,
  addVPAToPerson,
  setTransactions,
  setUploadedFile,
  matchTransaction,
  loadStateFromStorage: loadStateFromStorageAction,
} = appSlice.actions

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
