import type {
  ApprovalState,
  Impact,
  Priority,
  Role,
  SlaClockState,
  TicketStatus,
  TicketType,
  Urgency
} from "@itsm/contracts";

import { ensureValidTransition } from "../policies/status-transition.policy";
import { calculatePriority } from "../services/priority-matrix.service";
import { nextSlaClockState } from "../services/sla-escalation.service";
import type { ServiceRequestApprovalSnapshot } from "./service-request-approval";
import type { SlaClockSnapshot } from "./sla-clock";

export interface TicketPrimitives {
  id: string;
  type: TicketType;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  urgency: Urgency;
  impact: Impact;
  reporterId: string;
  assigneeId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  slaClock: SlaClockSnapshot;
  serviceRequestApproval?: ServiceRequestApprovalSnapshot;
}

export interface CreateTicketInput {
  id: string;
  type: TicketType;
  title: string;
  description: string;
  reporterId: string;
  urgency: Urgency;
  impact: Impact;
  requiresApproval?: boolean;
  createdAt: Date;
}

class SlaClockChildEntity {
  private state: SlaClockState;
  private startedAt?: Date;
  private pausedAt?: Date;
  private stoppedAt?: Date;
  private elapsedSeconds: number;

  private constructor(snapshot: SlaClockSnapshot) {
    this.state = snapshot.state;
    this.startedAt = snapshot.startedAt;
    this.pausedAt = snapshot.pausedAt;
    this.stoppedAt = snapshot.stoppedAt;
    this.elapsedSeconds = snapshot.elapsedSeconds;
  }

  static createForNewTicket(now: Date): SlaClockChildEntity {
    return new SlaClockChildEntity({
      state: "START",
      startedAt: now,
      elapsedSeconds: 0
    });
  }

  static rehydrate(snapshot: SlaClockSnapshot): SlaClockChildEntity {
    return new SlaClockChildEntity(snapshot);
  }

  transitionForStatus(nextStatus: TicketStatus, now: Date): void {
    const nextState = nextSlaClockState(nextStatus, this.state);
    if (nextState === this.state) {
      return;
    }

    this.state = nextState;

    if (nextState === "PAUSED") {
      this.pausedAt = now;
      return;
    }

    if (nextState === "RUNNING") {
      if (!this.startedAt) {
        this.startedAt = now;
      }
      this.pausedAt = undefined;
      this.stoppedAt = undefined;
      return;
    }

    if (nextState === "STOPPED") {
      this.stoppedAt = now;
    }
  }

  getState(): SlaClockState {
    return this.state;
  }

  getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  toSnapshot(): SlaClockSnapshot {
    return {
      state: this.state,
      startedAt: this.startedAt,
      pausedAt: this.pausedAt,
      stoppedAt: this.stoppedAt,
      elapsedSeconds: this.elapsedSeconds
    };
  }
}

class ServiceRequestApprovalChildEntity {
  private state: ApprovalState;
  private approverId?: string;
  private reason?: string;
  private updatedAt?: Date;

  private constructor(snapshot: ServiceRequestApprovalSnapshot) {
    this.state = snapshot.state;
    this.approverId = snapshot.approverId;
    this.reason = snapshot.reason;
    this.updatedAt = snapshot.updatedAt;
  }

  static create(required: boolean, now: Date): ServiceRequestApprovalChildEntity {
    return new ServiceRequestApprovalChildEntity({
      state: required ? "PENDING" : "NOT_REQUIRED",
      updatedAt: now
    });
  }

  static rehydrate(snapshot: ServiceRequestApprovalSnapshot): ServiceRequestApprovalChildEntity {
    return new ServiceRequestApprovalChildEntity(snapshot);
  }

  isPending(): boolean {
    return this.state === "PENDING";
  }

  getState(): ApprovalState {
    return this.state;
  }

  toSnapshot(): ServiceRequestApprovalSnapshot {
    return {
      state: this.state,
      approverId: this.approverId,
      reason: this.reason,
      updatedAt: this.updatedAt
    };
  }
}

/**
 * Ticket aggregate root.
 * Child entities (SLAClock and ServiceRequestApproval) are private and can only
 * be manipulated through aggregate methods.
 */
export class Ticket {
  private readonly id: string;
  private readonly type: TicketType;
  private title: string;
  private description: string;
  private status: TicketStatus;
  private priority: Priority;
  private urgency: Urgency;
  private impact: Impact;
  private readonly reporterId: string;
  private assigneeId?: string;
  private version: number;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private resolvedAt?: Date;
  private closedAt?: Date;
  private readonly slaClock: SlaClockChildEntity;
  private readonly serviceRequestApproval?: ServiceRequestApprovalChildEntity;

  private constructor(primitives: TicketPrimitives) {
    this.id = primitives.id;
    this.type = primitives.type;
    this.title = primitives.title;
    this.description = primitives.description;
    this.status = primitives.status;
    this.priority = primitives.priority;
    this.urgency = primitives.urgency;
    this.impact = primitives.impact;
    this.reporterId = primitives.reporterId;
    this.assigneeId = primitives.assigneeId;
    this.version = primitives.version;
    this.createdAt = primitives.createdAt;
    this.updatedAt = primitives.updatedAt;
    this.resolvedAt = primitives.resolvedAt;
    this.closedAt = primitives.closedAt;
    this.slaClock = SlaClockChildEntity.rehydrate(primitives.slaClock);

    if (primitives.serviceRequestApproval) {
      this.serviceRequestApproval = ServiceRequestApprovalChildEntity.rehydrate(
        primitives.serviceRequestApproval
      );
    }
  }

  static create(input: CreateTicketInput): Ticket {
    const approvalRequired = input.type === "SERVICE_REQUEST" && Boolean(input.requiresApproval);

    return new Ticket({
      id: input.id,
      type: input.type,
      title: input.title,
      description: input.description,
      status: "NEW",
      priority: calculatePriority(input.urgency, input.impact),
      urgency: input.urgency,
      impact: input.impact,
      reporterId: input.reporterId,
      version: 1,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      slaClock: SlaClockChildEntity.createForNewTicket(input.createdAt).toSnapshot(),
      serviceRequestApproval:
        input.type === "SERVICE_REQUEST"
          ? ServiceRequestApprovalChildEntity.create(
              approvalRequired,
              input.createdAt
            ).toSnapshot()
          : undefined
    });
  }

  static rehydrate(primitives: TicketPrimitives): Ticket {
    return new Ticket(primitives);
  }

  getId(): string {
    return this.id;
  }

  getType(): TicketType {
    return this.type;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getStatus(): TicketStatus {
    return this.status;
  }

  getPriority(): Priority {
    return this.priority;
  }

  getUrgency(): Urgency {
    return this.urgency;
  }

  getImpact(): Impact {
    return this.impact;
  }

  getReporterId(): string {
    return this.reporterId;
  }

  getAssigneeId(): string | undefined {
    return this.assigneeId;
  }

  getVersion(): number {
    return this.version;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getResolvedAt(): Date | undefined {
    return this.resolvedAt;
  }

  getClosedAt(): Date | undefined {
    return this.closedAt;
  }

  getSlaClockState(): SlaClockState {
    return this.slaClock.getState();
  }

  getSlaElapsedSeconds(): number {
    return this.slaClock.getElapsedSeconds();
  }

  getApprovalState(): ApprovalState | undefined {
    return this.serviceRequestApproval?.getState();
  }

  changeStatus(nextStatus: TicketStatus, actorRole: Role, now: Date = new Date()): void {
    ensureValidTransition(this.status, nextStatus, actorRole);

    if (
      this.type === "SERVICE_REQUEST" &&
      nextStatus === "RESOLVED" &&
      this.serviceRequestApproval?.isPending()
    ) {
      throw new Error("APPROVAL_REQUIRED");
    }

    this.status = nextStatus;

    if (nextStatus === "RESOLVED") {
      this.resolvedAt = now;
    }

    if (nextStatus === "CLOSED") {
      this.closedAt = now;
    }

    this.slaClock.transitionForStatus(nextStatus, now);
    this.touch(now);
  }

  managerOverride(forcedStatus: TicketStatus, now: Date = new Date()): void {
    if (
      this.type === "SERVICE_REQUEST" &&
      forcedStatus === "RESOLVED" &&
      this.serviceRequestApproval?.isPending()
    ) {
      throw new Error("APPROVAL_REQUIRED");
    }

    this.status = forcedStatus;

    if (forcedStatus === "RESOLVED") {
      this.resolvedAt = now;
    }

    if (forcedStatus === "CLOSED") {
      this.closedAt = now;
    }

    this.slaClock.transitionForStatus(forcedStatus, now);
    this.touch(now);
  }

  changePriority(urgency: Urgency, impact: Impact, now: Date = new Date()): void {
    this.urgency = urgency;
    this.impact = impact;
    this.priority = calculatePriority(urgency, impact);
    this.touch(now);
  }

  reassign(assigneeId: string, now: Date = new Date()): void {
    this.assigneeId = assigneeId;
    this.touch(now);
  }

  toPrimitives(): TicketPrimitives {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      urgency: this.urgency,
      impact: this.impact,
      reporterId: this.reporterId,
      assigneeId: this.assigneeId,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      resolvedAt: this.resolvedAt,
      closedAt: this.closedAt,
      slaClock: this.slaClock.toSnapshot(),
      serviceRequestApproval: this.serviceRequestApproval?.toSnapshot()
    };
  }

  private touch(now: Date): void {
    this.version += 1;
    this.updatedAt = now;
  }
}
