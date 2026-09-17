import { PortalActionItem } from '../../../types/v4/reporting';

export class PortalActionService {
  /**
   * Processes a client's response to an action item.
   * Modifies only workflow acknowledgement state; zero autonomous financial mutation.
   */
  public static respondToActionItem(
    item: PortalActionItem,
    clientResponse: string,
    actionType: 'COMPLETED' | 'DISMISSED' = 'COMPLETED'
  ): PortalActionItem {
    if (item.status === 'COMPLETED' || item.status === 'DISMISSED') {
      throw new Error(`Action item ${item.actionId} is already ${item.status}`);
    }

    const now = new Date().toISOString();
    return {
      ...item,
      status: actionType,
      clientResponse: clientResponse ? clientResponse.trim() : undefined,
      completedAt: now
    };
  }
}
