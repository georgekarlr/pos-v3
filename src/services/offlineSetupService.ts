import { SettingsService } from './settingsService'
import { ProductService } from './productService'
import { PosService } from './posService'
import { PromotionService } from './promotionService'
import { CustomerService } from './customerService'
import { getTerminalId, saveTerminalId } from '../utils/terminalStorage'

export interface SetupProgressState {
  currentStepIndex: number
  totalSteps: number
  stepTitle: string
  progressPercentage: number
  isComplete: boolean
  error?: string | null
}

export const SETUP_STEPS = [
  'Fetching Business Settings & Tax Rules',
  'Caching Catalog & Product Database',
  'Loading Active Terminals & POS Settings',
  'Saving Active Promotions & Discounts',
  'Caching Customer Registry & Profiles'
]

export class OfflineSetupService {
  /**
   * Run initial post-login data fetch and offline caching process.
   * Progress callback receives real-time updates for UI rendering.
   */
  static async runSetup(
    onProgress?: (state: SetupProgressState) => void
  ): Promise<boolean> {
    const totalSteps = SETUP_STEPS.length

    const updateProgress = (stepIdx: number, errText?: string | null) => {
      const pct = Math.min(100, Math.round(((stepIdx + 1) / totalSteps) * 100))
      if (onProgress) {
        onProgress({
          currentStepIndex: stepIdx,
          totalSteps,
          stepTitle: SETUP_STEPS[stepIdx] || 'Completing Setup...',
          progressPercentage: pct,
          isComplete: stepIdx >= totalSteps,
          error: errText || null
        })
      }
    }

    try {
      // Step 1: Business Settings
      updateProgress(0)
      try {
        await SettingsService.getBusinessSettings(true)
      } catch (err) {
        console.warn('[OfflineSetup] Business settings fetch warning:', err)
      }

      // Step 2: Product Catalog
      updateProgress(1)
      try {
        await ProductService.getAllProducts(1000, 0, undefined, true)
      } catch (err) {
        console.warn('[OfflineSetup] Product catalog fetch warning:', err)
      }

      // Step 3: Active Terminals
      updateProgress(2)
      try {
        const { data: terminals } = await PosService.getActiveTerminals()
        if (terminals && terminals.length > 0) {
          const currentTerminal = getTerminalId()
          if (!currentTerminal || !terminals.some(t => t.id === currentTerminal)) {
            saveTerminalId(terminals[0].id)
          }
        }
      } catch (err) {
        console.warn('[OfflineSetup] Terminals fetch warning:', err)
      }

      // Step 4: Active Promotions
      updateProgress(3)
      try {
        await PromotionService.getPromotions({ limit: 1000, filterStatus: 'all' })
      } catch (err) {
        console.warn('[OfflineSetup] Promotions fetch warning:', err)
      }

      // Step 5: Customer Database
      updateProgress(4)
      try {
        await CustomerService.getCustomers()
      } catch (err) {
        console.warn('[OfflineSetup] Customers fetch warning:', err)
      }

      // Mark completion
      if (onProgress) {
        onProgress({
          currentStepIndex: totalSteps,
          totalSteps,
          stepTitle: 'Offline Workspace Ready',
          progressPercentage: 100,
          isComplete: true,
          error: null
        })
      }

      return true
    } catch (err: any) {
      console.error('[OfflineSetup] Critical error during offline setup:', err)
      if (onProgress) {
        onProgress({
          currentStepIndex: totalSteps,
          totalSteps,
          stepTitle: 'Setup Finished with Warnings',
          progressPercentage: 100,
          isComplete: true,
          error: err?.message || 'Failed to sync some offline resources'
        })
      }
      return false
    }
  }
}
