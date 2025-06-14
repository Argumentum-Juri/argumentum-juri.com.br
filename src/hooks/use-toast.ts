import * as React from "react"
import { ToastActionElement, type ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 20
export const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: Omit<ToasterToast, "id"> & { id?: string }
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast> & Pick<ToasterToast, "id">
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
      force?: boolean
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [
          ...state.toasts,
          { ...action.toast, id: action.toast.id || genId() },
        ].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId, force } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else if (force) {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: ((state: State) => void)[] = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

interface Toast extends Omit<ToasterToast, "id"> {
  id?: string
}

// Create and manage toasts
function toast(props: Toast | string, options?: Toast) {
  // Handle string as first argument (sonner-like)
  if (typeof props === 'string') {
    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: {
        title: props,
        ...options,
      },
    })
    return
  }

  // Handle object argument (old interface)
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: props,
  })
}

// Add helpers to match sonner API
toast.error = function(title: string, options?: Toast) {
  return toast({
    variant: "destructive",
    title: title,
    ...options,
  })
}

toast.success = function(title: string, options?: Toast) {
  return toast({
    title: title,
    ...options,
  })
}

toast.info = function(title: string, options?: Toast) {
  return toast({
    title: title,
    ...options,
  })
}

// Update variant type to ensure 'warning' is a valid variant
toast.warning = function(title: string, options?: Toast) {
  return toast({
    // Use default variant for warning as 'warning' is not defined in toastVariants
    variant: "default",
    title: title,
    ...options,
  })
}

// Update variant type to ensure 'loading' is a valid variant
toast.loading = function(title: string, options?: Toast) {
  return toast({
    // Use default variant for loading as 'loading' is not defined in toastVariants
    variant: "default",
    title: title,
    ...options,
  })
}

toast.dismiss = function(toastId?: string) {
  dispatch({
    type: actionTypes.DISMISS_TOAST,
    toastId,
  })
}

// This is the interface for the useToast hook return value
interface ToastAPI {
  toast: typeof toast
  toasts: ToasterToast[]
  dismiss: (toastId?: string) => void
}

// Updated hook return to include `toasts` property for the Toaster component
function useToast(): ToastAPI {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    toast,
    toasts: state.toasts,
    dismiss: (toastId?: string) => {
      dispatch({
        type: actionTypes.DISMISS_TOAST,
        toastId,
      })
    }
  }
}

export { toast, useToast }
