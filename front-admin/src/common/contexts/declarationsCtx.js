/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useCallback } from 'react';
import { Modal } from 'antd';
import superagent from 'superagent';

const DeclarationsContext = React.createContext();

export function DeclarationsProvider(props) {
  const [availableMonths, _setAvailableMonths] = useState([]);
  const [selectedMonthId, _setSelectedMonthId] = useState(null);
  const [declarations, _setDeclarations] = useState([]);
  const [isLoading, _setIsLoading] = useState(true);

  const setSelectedMonthId = async (monthId) => {
    _setSelectedMonthId(monthId);
    _setIsLoading(true);

    const { body } = await superagent.get(`/zen-admin-api/declarations?monthId=${monthId}`);
    _setIsLoading(false);
    _setDeclarations(body);
  };

  const init = async () => {
    if (!availableMonths.length) {
      _setIsLoading(true);

      const { body } = await superagent.get('/zen-admin-api/declarationsMonths');
      _setIsLoading(false);
      _setAvailableMonths(body);
      setSelectedMonthId(body[0].id);
    }
  };

  const removeDeclarations = useCallback(async () => {
    Modal.confirm({
      content: 'Je confirme la suppression des actualisations !!!',
      onOk() {
        superagent
          .post('/zen-admin-api/settings/remove-declarations')
          .then(() => {
            Modal.success({
              content: 'L\'ensemble des actualisations sont supprimées.',
            });
          });
      },
    });
  }, []);

  return (
    <DeclarationsContext.Provider
      {...props}
      value={{
        availableMonths,
        selectedMonthId,
        declarations,
        isLoading,
        // function
        setSelectedMonthId,
        init,
        removeDeclarations,
      }}
    />
  );
}


export const useDeclarations = () => {
  const context = React.useContext(DeclarationsContext);
  if (!context) throw new Error('useDeclarations must be used in DeclarationsProvider');

  return context;
};
