// FIXED IMPORT PATHWAY: Pointing directly to your own type index file
import { LessonStatus } from "@/types";

export interface AttendanceResolution {
  creditDelta: number;
  shouldRestoreCredit: boolean;
  requiresReschedule: boolean;
  notifyUser: boolean;
  auditLogReason: string;
  retainsRecordingAccess: boolean;
}

export class AttendanceLedgerEngine {
  /**
   * Processes the strict accounting consequences of an attendance status update.
   * Aligns directly with allowed state transitions and credit requirements.
   */
  public static processStatusTransition(
    currentStatus: LessonStatus,
    targetStatus: LessonStatus,
    classType: "private_1to1" | "group_fixed" | "group_flexible"
  ): AttendanceResolution {
    
    // Default outcome structure
    const outcome: AttendanceResolution = {
      creditDelta: 0,
      shouldRestoreCredit: false,
      requiresReschedule: false,
      notifyUser: false,
      auditLogReason: `Status shifted from ${currentStatus} to ${targetStatus}`,
      retainsRecordingAccess: false
    };

    switch (targetStatus) {
      case "student_attended":
      case "completed":
        outcome.creditDelta = -1; // Deduct credit for completed delivery
        break;

      case "student_absent":
      case "chargeable_no_show":
        outcome.creditDelta = -1; // Chargeable outcome
        outcome.auditLogReason = `Chargeable no-show recorded. Lesson credit deducted.`;
        if (classType !== "private_1to1") {
          outcome.retainsRecordingAccess = true; // Group classes retain recording access if permitted
        }
        break;

      case "student_cancellation":
        // Private lessons apply configured rule logic; group classes are chargeable late cancels
        if (classType === "private_1to1") {
          outcome.creditDelta = 0;
          outcome.requiresReschedule = true;
          outcome.auditLogReason = `Student cancelled private lesson. Flagged for rescheduling without charge.`;
        } else {
          outcome.creditDelta = -1;
          outcome.retainsRecordingAccess = true;
          outcome.auditLogReason = `Late group cancellation. Charge applied, recording access retained.`;
        }
        break;

      case "tutor_cancellation":
        // CRITICAL SPEC: Restore credit, mark for reschedule, notify users, log details explicitly
        outcome.creditDelta = 0;
        outcome.shouldRestoreCredit = true;
        outcome.requiresReschedule = true;
        outcome.notifyUser = true;
        outcome.auditLogReason = `CRITICAL: Instructor cancellation recorded. Consumed credit restored. Lesson marked for rescheduling.`;
        break;

      case "cancelled_without_charge":
      case "rescheduled":
        outcome.creditDelta = 0;
        outcome.requiresReschedule = true;
        break;
    }

    return outcome;
  }
}
