import { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, isValid } from "date-fns";
import enUS from "date-fns/locale/en-US";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./ShiftCalendar.css";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: enUS }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

/**
 * Shift Calendar Component
 * Displays shifts in a calendar view with week/month toggle
 */
export default function ShiftCalendar({
  shifts = [],
  employees = [],
  onShiftClick,
  onSlotSelect,
  onShiftUpdate,
  view = "week",
  onViewChange,
  selectedShiftIds = [],
  onShiftSelect,
  selectionMode = false,
}) {
  // Convert shifts to calendar events
  const events = useMemo(() => {
    return (shifts || [])
      .map((shift) => {
        const employeeId =
          typeof shift.employeeId === "object" && shift.employeeId !== null
            ? shift.employeeId._id
            : shift.employeeId;

        const employee = (employees || []).find((e) => e._id === employeeId);

        const start = new Date(shift.startAt);
        const end = new Date(shift.endAt);

        if (!isValid(start) || !isValid(end)) return null;

        return {
          id: shift._id,
          title: employee ? employee.name : "Unassigned",
          start,
          end,
          resource: {
            shift,
            employee,
            roleRequired: shift.roleRequired,
            status: shift.status,
            breakMinutes: shift.breakMinutes,
            notes: shift.notes,
          },
        };
      })
      .filter(Boolean);
  }, [shifts, employees]);

  // Event style based on status and role
  const eventStyleGetter = (event) => {
    const { status, roleRequired } = event.resource || {};

    let backgroundColor = "#3174ad";
    if (status === "draft") backgroundColor = "#6c757d";
    if (status === "published") backgroundColor = "#28a745";
    if (status === "cancelled") backgroundColor = "#dc3545";

    const roleColors = {
      cashier: "#ffc107",
      fuelBoy: "#17a2b8",
      security: "#6f42c1",
      general: "#6c757d",
    };

    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${roleColors[roleRequired] || "#333"}`,
        borderRadius: "4px",
        opacity: status === "cancelled" ? 0.6 : 1,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  // Custom event component
  const EventComponent = ({ event }) => {
    const { shift, employee } = event.resource || {};
    const duration = Number(shift?.computedHours || 0);
    const isSelected = selectedShiftIds.includes(shift?._id);
    const isDraft = shift?.status === 'draft';

    return (
      <div className={`shift-event ${isSelected ? 'selected' : ''}`}>
        {selectionMode && isDraft && (
          <input
            type="checkbox"
            className="shift-checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onShiftSelect?.(shift._id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="shift-event-title">{employee?.name || "Unassigned"}</div>
        <div className="shift-event-time">
          {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
        </div>
        <div className="shift-event-duration">{duration.toFixed(1)}h</div>
        {isDraft && (
          <span className="shift-badge draft">Draft</span>
        )}
      </div>
    );
  };

  // Handle event selection
  const handleSelectEvent = (event) => {
    onShiftClick?.(event.resource.shift);
  };

  // Handle slot selection (create new shift)
  const handleSelectSlot = (slotInfo) => {
    onSlotSelect?.({
      startAt: slotInfo.start,
      endAt: slotInfo.end,
    });
  };

  // Handle event drag/drop (reschedule)
  const handleEventDrop = ({ event, start, end }) => {
    onShiftUpdate?.(event.resource.shift._id, { startAt: start, endAt: end });
  };

  // Handle event resize
  const handleEventResize = ({ event, start, end }) => {
    onShiftUpdate?.(event.resource.shift._id, { startAt: start, endAt: end });
  };

  return (
    <div className="shift-calendar-container">
      <div className="calendar-toolbar">
        <div className="view-toggle">
          <button
            className={view === "week" ? "active" : ""}
            onClick={() => onViewChange?.("week")}
          >
            Week
          </button>
          <button
            className={view === "month" ? "active" : ""}
            onClick={() => onViewChange?.("month")}
          >
            Month
          </button>
        </div>

        <div className="legend">
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#6c757d" }} />
            Draft
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#28a745" }} />
            Published
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ borderLeft: "4px solid #ffc107" }} />
            Cashier
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ borderLeft: "4px solid #17a2b8" }} />
            Fuel Boy
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ borderLeft: "4px solid #6f42c1" }} />
            Security
          </span>
        </div>
      </div>

      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}
        view={view}
        onView={(v) => onViewChange?.(v)}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        resizable
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        draggableAccessor={(event) => event?.resource?.shift?.status !== "cancelled"}
        eventPropGetter={eventStyleGetter}
        components={{ event: EventComponent }}
        step={30}
        timeslots={2}
        defaultDate={new Date()}
        views={["week", "month", "day"]}
      />
    </div>
  );
}
