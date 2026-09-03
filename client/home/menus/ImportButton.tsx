import { Ellipsis, Upload } from 'lucide-react';
import { read, utils } from 'xlsx';

import parseSheet from '../../../shared/parseSheet';
import { Subjects } from '../../../shared/types';
import { ModalType, useSetModal } from '../../contexts/modal';
import { upload } from '../../utils/browser';
import { useSetResults, withSelected } from '../results';

const SHEET_NAME = 'Felvett kurzusok';

enum ImportColumn {
  ID = 0,
  NAME = 2,
  CODE = 3,
  TYPE = 4,
  SCHEDULE = 6,
  TEACHER = 7,
}

export default ({ handle }: { handle?: (x: Subjects) => Promise<void> }) => {
  const setResults = useSetResults();
  const setModal = useSetModal();
  return <button
    onClick={() =>
      setModal(
        ModalType.INFO,
        <p>
          A táblázatot Neptunban a <b>Menü &gt; Tárgyak &gt; Felvett kurzusok</b> oldalon, a{' '}
          <b>
            <Ellipsis/> &gt; Exportálás
          </b>{' '}
          gombbal lehet letölteni.
        </p>,
        () =>
          upload('.xlsx').then(file => file.arrayBuffer()).then(read).then(async workbook => {
            if (workbook.SheetNames[0] !== SHEET_NAME)
              throw setModal(ModalType.ERROR, 'A fájl nem az elvárt forrásból származik.');
            const data =
              (utils.sheet_to_json(workbook.Sheets[SHEET_NAME], {
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
                ), {} as Subjects);
            await handle?.(data);
            setResults(withSelected(data, true));
          }),
      )}
  >
    <Upload/>
    {handle ? 'Felvett kurzusok betöltése' : 'Importálás Neptunból'}
  </button>;
};
