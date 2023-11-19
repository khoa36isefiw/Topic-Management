import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ThesisService from "../services/ThesisService";
import ThesisEditor from "../components/ThesisEditor";

function EditThesisPage() {
  const { tid } = useParams();
  const navigate = useNavigate();
  const [thesis, setThesis] = useState(null);

  const onLoad = async () => {
    if (tid) {
      setThesis(await ThesisService.getThesis(tid, { getSubmissions: true }));
    }
  };

  const handleSubmit = async (thesis) => {
    if (tid) {
      await ThesisService.updateThesis(tid, thesis);
      navigate(`/thesis/${tid}`, { replace: true });
    } else {
      const obj = await ThesisService.createThesis(thesis);
      navigate(`/thesis/${obj._id}`, { replace: true });
    }
  };

  useEffect(() => {
    onLoad();
  }, []);

  return (
    <>
      <ThesisEditor thesis={thesis} onSubmit={handleSubmit} />
    </>
  );
}

export default EditThesisPage;
