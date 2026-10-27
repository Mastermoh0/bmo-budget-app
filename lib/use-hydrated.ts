'use client'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false
// Keep server-rendered forms disabled until their client-side submit handlers are attached.
export function useHydrated() { return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot) }
