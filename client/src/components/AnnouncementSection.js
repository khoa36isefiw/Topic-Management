import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import dayjs from 'dayjs';
import AnnouncementService from '../services/AnnouncementService';
import { X } from 'react-bootstrap-icons';

function AnnouncementSection() {
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  const onLoad = async () => {
    try {
      setLoading(true);
      setAnnouncements(await AnnouncementService.getAnnouncements());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    onLoad();
  }, []);

  const dismissAnnouncement = async id => {
    try {
      await AnnouncementService.readAnnouncement(id);
      setAnnouncements(prev => {
        const { items, ...rest } = prev;
        return {
          items: items.filter(e => e._id !== id),
          ...rest
        }
      });
    } catch (err) {

    }
    
  };

  return <>
    {
      announcements.items && announcements.items.length > 0 &&
        <Card className='mb-4'>
          <Card.Body>
            <Card.Title>Announcements</Card.Title>
            <Card.Text>
              {
                announcements.items.map(e => (
                  <>
                    <hr />
                    <div className='clearfix'>
                      <h4 className='float-start'>{e.title}</h4>
                      <Button variant='light' className='float-end' onClick={() => dismissAnnouncement(e._id)}>
                        <span style={{ verticalAlign: 'super' }}><X /></span>
                      </Button>
                    </div>
                    <h6 className='text-muted'>{dayjs(e.sent).format('LLL')}</h6>
                    <p>{e.text}</p>
                  </>
                ))
              }
            </Card.Text>
          </Card.Body>
        </Card>
    }
  </>
}

export default AnnouncementSection;
