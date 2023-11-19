import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import colorPalette from '../themes/legendColorPalette';

function DefenseCalendar(props) {
  const navigate = useNavigate();
  const { defenses, onEventClick } = props;
  const calendarRef = useRef(null);

  const doEventClick = (arg) => {
    if (onEventClick && calendarRef) {
      onEventClick(defenses.find(e => e._id === arg.event.id));
    }
  };

  return (
    <FullCalendar
      plugins={[ dayGridPlugin, listPlugin, interactionPlugin ]}
      initialView='listMonth'
      selectable
      expandRows
      height='65vh'
      headerToolbar={{
        start: 'today,prev,next',
        center: 'title',
        end: 'gotoPage'
      }}
      eventClick={doEventClick}
      events={defenses.map(e => ({
        id: e._id,
        start: e.start,
        end: e.end,
        title: e.description || e.thesis.title,
        classNames: 'cursor-pointer',
        backgroundColor: colorPalette[e.status].backgroundColor
      }))}
      customButtons={{
        gotoPage: {
          text: 'Go to Defense Schedule',
          click: () => {
            navigate('/defense');
          }
        }
      }}
      ref={calendarRef}
    />
  )
}

export default DefenseCalendar;
