import { Download, Share2, Upload } from 'lucide-react';

import { useData } from '../../contexts/data';
import { ModalType, useSetModal } from '../../contexts/modal';
import { download, gzip, upload } from '../../utils/browser';
import ImportButton from './ImportButton';

export default () => {
  const setModal = useSetModal();
  const { subjects } = useData();
  return <section className='surface'>
    <div className='actions'>
      <button
        onClick={() =>
          download(
            'orarend.json',
            'data:application/json;charset=utf-8,'
              + encodeURIComponent(JSON.stringify(subjects[0])),
          )}
      >
        <Download/>
        Exportálás
      </button>
      <button
        onClick={() => upload('.json').then(file => file.text()).then(JSON.parse).then(subjects[1])}
      >
        <Upload/>
        Importálás
      </button>
      <ImportButton/>
      <button
        onClick={async () => {
          const hash = await gzip(JSON.stringify(subjects[0]));
          navigator.clipboard.writeText(location.origin + '/#' + hash);
          setModal(ModalType.INFO, 'URL másolva a vágólapra.', () => location.hash = hash);
        }}
      >
        <Share2/>
        URL megosztása
      </button>
    </div>
  </section>;
};
