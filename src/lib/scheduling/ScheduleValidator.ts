import { AppRole } from "@/context/AppContext";

export interface TimeSlot {
  startTime: Date; // UTC Instants
  endTime: Date;
  academyTimezone: string; // e.g., 'Asia/Jakarta'
}

export interface LessonScheduleItem extends TimeSlot {
  id: string;
  tutorId: string;
  studentIds: string[];
  capacityLimit: number;
  subject: string;
}

export class ScheduleValidatorEngine {
  /**
   * Evaluates time parameters to prevent accidental overlapping slots.
   * Compares instant ranges to secure structural isolation bounds.
   */
  public static hasTimingOverlap(slotA: TimeSlot, slotB: TimeSlot): boolean {
    return slotA.startTime < slotB.endTime && slotB.startTime < slotA.endTime;
  }

  /**
   * Verifies schedule requests against all active lessons for both tutors and students.
   * Prevents simultaneous conflict double-bookings.
   */
  public static detectBookingConflicts(
    newSlot: Omit<LessonScheduleItem, "id" | "studentIds">,
    incomingStudents: string[],
    existingLessons: LessonScheduleItem[]
  ): { conflictFound: boolean; reason?: string } {
    
    for (const lesson of existingLessons) {
      if (this.hasTimingOverlap(newSlot, lesson)) {
        // Rule Check 1: Tutor Conflict Protection
        if (lesson.tutorId === newSlot.tutorId) {
          return {
            conflictFound: true,
            reason: `Tutor Overlap Conflict: Instructor is already booked for ${lesson.subject} in this window.`,
          };
        }

        // Rule Check 2: Student Conflict Protection
        const overlappingStudent = incomingStudents.find((id) =>
          lesson.studentIds.includes(id)
        );
        if (overlappingStudent) {
          return {
            conflictFound: true,
            reason: `Student Overlap Conflict: Student ID ${overlappingStudent} is already scheduled in an overlapping class.`,
          };
        }
      }
    }

    return { conflictFound: false };
  }

  /**
   * Handles group capacity limits and structures waitlist positioning.
   * Does not automatically activate billing configurations.
   */
  public static processGroupCapacity(
    lesson: LessonScheduleItem,
    currentWaitlistCount: number
  ): { allowed: boolean; targetAction: "enroll" | "waitlist"; position?: number } {
    if (lesson.studentIds.length < lesson.capacityLimit) {
      return { allowed: true, targetAction: "enroll" };
    }

    // Capacity exceeded: Route to Waitlist queue position
    const nextPosition = currentWaitlistCount + 1;
    return {
      allowed: false,
      targetAction: "waitlist",
      position: nextPosition,
    };
  }
}
