import { Download, Ellipsis, Share2, Upload } from 'lucide-react';
import { read, utils } from 'xlsx';

import parseSheet from '../../../shared/parseSheet';
import { Subjects } from '../../../shared/types';
import { useData } from '../../contexts/data';
import { ModalType, useSetModal } from '../../contexts/modal';
import { download, gzip, upload } from '../../utils/browser';
import { useSetResults, withSelected } from '../results';

const COURSES_NAME = 'Felvett kurzusok';

enum ImportColumn {
  ID = 0,
  NAME = 2,
  CODE = 3,
  TYPE = 4,
  SCHEDULE = 6,
  TEACHER = 7,
}

export default () => {
  const setModal = useSetModal();
  const { subjects } = useData();
  const setResults = useSetResults();
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
      <button
        onClick={() =>
          setModal(
            ModalType.INFO,
            <p>
              A táblázatot Neptunban a <b>Menü &gt; Tárgyak &gt; Felvett kurzusok</b> oldalon, a
              {' '}
              <b>
                <Ellipsis/> &gt; Exportálás
              </b>{' '}
              gombbal lehet letölteni.
            </p>,
            () =>
              upload('.xlsx').then(file => file.arrayBuffer()).then(read).then(workbook =>
                workbook.SheetNames[0] !== COURSES_NAME
                  ? setModal(ModalType.ERROR, 'A fájl nem az elvárt forrásból származik.')
                  : setResults(
                    withSelected(
                      (utils.sheet_to_json(workbook.Sheets[COURSES_NAME], {
                        range: 1,
                        header: 1,
                        raw: true,
                      }) as string[][]).reduce((results, row) =>
                        parseSheet(
                          results,
                          [row[ImportColumn.CODE], row[ImportColumn.TYPE], row[ImportColumn.ID]],
                          row[ImportColumn.NAME],
                          row[ImportColumn.TEACHER].split(', '),
                          row[ImportColumn.SCHEDULE],
                          true,
                        ), {} as Subjects),
                      true,
                      true,
                    ),
                  )
              ),
          )}
      >
        <Upload/>
        Importálás Neptunból
      </button>
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
