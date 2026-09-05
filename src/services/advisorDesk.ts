import {
  AdvisorTask,
  AdvisorTaskPriority,
  AdvisorTaskStatus,
  Client,
  SmartAlert,
  Goal,
} from "../types/wealth";

/**
 * Automatically compiles the Advisor Desk TODAY operational queue
 * from high-priority clients, active alerts, review reminders, and pending goals.
 */
export function generateDailyAdvisorDeskTasks(params: {
  clients: Client[];
  activeAlerts?: SmartAlert[];
  goals?: Goal[];
  asOfDate?: string;
}): AdvisorTask[] {
  const { clients, activeAlerts = [], goals = [], asOfDate = new Date().toISOString() } = params;
  const tasks: AdvisorTask[] = [];

  const todayStr = asOfDate.split("T")[0];

  // 1. High-Priority Clients & Reminders
  clients.forEach((c) => {
    if (c.priority === "High") {
      tasks.push({
        id: `task_hp_${c.id}`,
        clientId: c.id,
        clientName: c.name,
        title: `Mandate Review: ${c.name} (${c.category})`,
        description: `High-priority mandate requires quarterly asset-allocation review and touchpoint. Notes: ${c.notes || "None"}.`,
        category: "HIGH_PRIORITY",
        status: "OPEN",
        priority: "HIGH",
        dueDate: c.reminderDate || todayStr,
        createdAt: asOfDate,
      });
    }

    if (c.reminderDate && c.reminderDate <= todayStr) {
      tasks.push({
        id: `task_rem_${c.id}`,
        clientId: c.id,
        clientName: c.name,
        title: `Follow-up Due: ${c.name}`,
        description: `Scheduled reminder due for ${c.name} via ${c.preferredChannel || "Phone"}.`,
        category: "FOLLOW_UP",
        status: "OPEN",
        priority: "MEDIUM",
        dueDate: c.reminderDate,
        createdAt: asOfDate,
      });
    }
  });

  // 2. Critical & Warning Portfolio Alerts
  activeAlerts.forEach((alert) => {
    const isCritical = String(alert.severity).toLowerCase() === "critical";
    tasks.push({
      id: `task_alert_${alert.id}`,
      clientId: alert.clientId,
      clientName: alert.clientName,
      title: `Portfolio Alert: ${alert.title}`,
      description: alert.message,
      category: "PORTFOLIO_ALERT",
      status: "OPEN",
      priority: isCritical ? "URGENT" : "HIGH",
      dueDate: todayStr,
      createdAt: alert.timestamp || asOfDate,
    });
  });

  // 3. Goal Funding Reviews
  goals.forEach((g) => {
    const cur = parseFloat(g.currentAmount) || 0;
    const tgt = parseFloat(g.targetAmount) || 1;
    if (cur / tgt < 0.35) {
      tasks.push({
        id: `task_goal_${g.id}`,
        title: `Goal Deficit Review: ${g.title || "Wealth Milestone"}`,
        description: `Goal is under 35% funded (Target: ₹${tgt.toLocaleString("en-IN")}). Recommend contribution increase.`,
        category: "GOAL_REVIEW",
        status: "OPEN",
        priority: g.priority === "Core" ? "HIGH" : "MEDIUM",
        dueDate: todayStr,
        createdAt: asOfDate,
      });
    }
  });

  // Sort tasks by priority: URGENT -> HIGH -> MEDIUM -> LOW
  const priorityRank: Record<AdvisorTaskPriority, number> = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  tasks.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  return tasks;
}

/**
 * Transitions task status adhering to the lifecycle:
 * OPEN -> IN_PROGRESS -> WAITING -> DONE / CANCELLED
 */
export function transitionTaskStatus(
  task: AdvisorTask,
  nextStatus: AdvisorTaskStatus,
  notes?: string
): AdvisorTask {
  return {
    ...task,
    status: nextStatus,
    notes: notes ? `${task.notes ? task.notes + " | " : ""}${notes}` : task.notes,
    completedAt: nextStatus === "DONE" ? new Date().toISOString() : task.completedAt,
  };
}
