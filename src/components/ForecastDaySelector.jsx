export default function ForecastDaySelector({
  selectedDate,
  onSelectDate
}) {

  const today = new Date();

  const upcomingDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);

    date.setDate(today.getDate() + index);

    return date;
  });

  function formatDateValue(date) {
    const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
  }

  function formatDayName(date, index) {
    if (index === 0) {
      return "Today";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short"
    });
  }

  function formatMonthDay(date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  }

  return (
    <div className="trip-day-section">
      <div className="trip-day-label">
        Trip Day
      </div>

      <div className="trip-day-options">
        {upcomingDays.map((date, index) => {
          const value = formatDateValue(date);

          return (
            <button
              key={value}
              type="button"
              className={`trip-day-button ${
                selectedDate === value ? "active" : ""
              }`}
              onClick={() => onSelectDate(value)}
            >
              <span className="trip-day-name">
                {formatDayName(date, index)}
              </span>

              <span className="trip-day-date">
                {formatMonthDay(date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}