// @flow

import React from 'react';
import { Card, Switch, Row } from 'antd';
import superagent from 'superagent';

async function updateUser(id, informations) {
  return superagent.put(`/zen-admin-api/user/${id}`, informations);
}

type Props = {
  user: Object
};

export default function UserActions({ user }: Props) {
  const setAuthorized = (val) => {
    updateUser(user.id, { isAuthorized: val });
  };

  const actions = [
    { title: 'Accès autorisé', key: 'isAuthorized', callback: setAuthorized },
  ];
  return (
    <Card title="Actions" style={{ marginBottom: '20px' }}>
      {actions.map((action) => (
        <Row key={action.title} align="middle" style={{ marginBottom: '8px' }}>
          <span style={{ marginRight: '8px' }}>{action.title}</span>
          <Switch
            defaultChecked={user[action.key]}
            onChange={action.callback}
          />
        </Row>
      ))}
    </Card>
  );
}
