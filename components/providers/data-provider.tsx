"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface BoothPerson {
  id: string
  route_no?: string
  vpa: string
  cc_no: string
  phone: string
  name?: string
  updated_at: string
  inserted_at: string
}

interface DataContextType {
  boothPeople: BoothPerson[]
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [boothPeople, setBoothPeople] = useState<BoothPerson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBoothPeople = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/booth-people?limit=all')
      
      if (!response.ok) {
        throw new Error('Failed to fetch booth people')
      }
      
      const result = await response.json()
      
      // Transform data to ensure consistent format
      const transformedData = result.data.map((person: any) => ({
        id: person.id,
        route_no: person.route_no || null,
        vpa: person.vpa || person.customerVPAs || '',
        cc_no: person.cc_no || '',
        phone: person.phone || '',
        name: person.name || '',
        updated_at: person.updated_at || person.inserted_at || new Date().toISOString(),
        inserted_at: person.inserted_at || new Date().toISOString()
      }))
      
      setBoothPeople(transformedData)
      
      // Store in localStorage for persistence across sessions
      localStorage.setItem('boothPeopleData', JSON.stringify(transformedData))
      localStorage.setItem('boothPeopleLastFetch', new Date().toISOString())
      
    } catch (err) {
      console.error('Error fetching booth people:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      
      // Try to load from localStorage as fallback
      const cachedData = localStorage.getItem('boothPeopleData')
      if (cachedData) {
        try {
          setBoothPeople(JSON.parse(cachedData))
        } catch (parseError) {
          console.error('Error parsing cached data:', parseError)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    await fetchBoothPeople()
  }

  // Load data on mount
  useEffect(() => {
    // Check if we have recent cached data (less than 5 minutes old)
    const cachedData = localStorage.getItem('boothPeopleData')
    const lastFetch = localStorage.getItem('boothPeopleLastFetch')
    
    if (cachedData && lastFetch) {
      const lastFetchTime = new Date(lastFetch).getTime()
      const now = new Date().getTime()
      const fiveMinutes = 5 * 60 * 1000
      
      if (now - lastFetchTime < fiveMinutes) {
        // Use cached data if it's recent
        try {
          setBoothPeople(JSON.parse(cachedData))
          setIsLoading(false)
          return
        } catch (parseError) {
          console.error('Error parsing cached data:', parseError)
        }
      }
    }
    
    // Fetch fresh data
    fetchBoothPeople()
  }, [])

  const value = {
    boothPeople,
    isLoading,
    error,
    refreshData,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}