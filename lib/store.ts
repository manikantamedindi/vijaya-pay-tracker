import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit"

// Types
interface BoothPerson {
  id: string
  name: string
  phone: string
  address: string
  customerVPAs: string // Single VPA string, not an array
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
        // Simply replace the VPA string
        person.customerVPAs = action.payload.vpa
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
    clearAllData: (state) => {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("booth-payment-app-state")
        } catch (error) {
          console.error("Error clearing sessionStorage:", error)
        }
      }
      return initialState
    },
  },
})

const loadStateFromStorage = (): AppState => {
  if (typeof window !== "undefined") {
    try {
      const savedState = sessionStorage.getItem("booth-payment-app-state")
      if (savedState) {
        console.log("Loaded state from sessionStorage:", savedState)
        return JSON.parse(savedState)
      } else {
        console.log("No saved state found in sessionStorage")
      }
    } catch (error) {
      console.error("Error loading state from sessionStorage:", error)
    }
  }
  return initialState
}

const saveStateToStorage = (state: AppState) => {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("booth-payment-app-state", JSON.stringify(state))
      console.log("Saved state to sessionStorage:", JSON.stringify(state))
    } catch (error) {
      console.error("Error saving state to sessionStorage:", error)
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
  clearAllData,
} = appSlice.actions

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
  preloadedState: { app: initialState },
})

// Load saved state on the client side after store creation
export const initializeStoreFromSession = () => {
  if (typeof window !== "undefined") {
    const savedState = loadStateFromStorage()
    console.log("Loading saved state from session storage:", savedState)
    if (savedState !== initialState) {
      store.dispatch(loadStateFromStorageAction())
      console.log("State loaded from session storage")
    }
  }
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
