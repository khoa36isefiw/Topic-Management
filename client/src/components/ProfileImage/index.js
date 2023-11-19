import { useEffect, useState } from 'react';
import Image from 'react-bootstrap/Image';
import defaultProfile from '../../default-profile-photo.jpg';
import AccountService from '../../services/AccountService';

function ProfileImage(props) {
  const { src, accountID, thumbnail, ...rest } = props;
  const [image, setImage] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const q = thumbnail ? { thumbnail: true } : {};
        const blob = await AccountService.getAccountImage(accountID, q);
        const fr = new FileReader();
        fr.onload = function() {
          setImage(fr.result);
        }
        fr.readAsDataURL(blob);
      } catch (error) {
        setImage(null);
      }
    }

    if (src) {
      setImage(src);
      return;
    }

    if (accountID) {
      load();
    } else {
      setImage(null);
    }
  }, [src, accountID]);

  return (
    <Image src={image || defaultProfile} {...rest} />
  );
}

export default ProfileImage;
