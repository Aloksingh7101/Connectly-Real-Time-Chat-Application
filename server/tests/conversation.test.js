const request = require('supertest');
const app = require('../src/app');

async function registerAndLogin(agent, overrides = {}) {
  const user = {
    name: 'User',
    username: 'user1',
    email: 'user1@example.com',
    password: 'password123',
    ...overrides,
  };
  const res = await agent.post('/api/auth/register').send(user);
  return res.body.data.user;
}

describe('Conversations & Messages', () => {
  test('creates a 1:1 conversation and finds the same one on repeat', async () => {
    const agentA = request.agent(app);
    const userA = await registerAndLogin(agentA, { username: 'alice', email: 'alice@example.com' });

    const agentB = request.agent(app);
    const userB = await registerAndLogin(agentB, { username: 'bob', email: 'bob@example.com' });

    const first = await agentA.post('/api/conversations').send({ participantId: userB._id });
    expect(first.status).toBe(200);

    const second = await agentA.post('/api/conversations').send({ participantId: userB._id });
    expect(second.body.data.conversation._id).toBe(first.body.data.conversation._id);
  });

  test('sends a message and both participants can fetch it', async () => {
    const agentA = request.agent(app);
    const userA = await registerAndLogin(agentA, { username: 'alice2', email: 'alice2@example.com' });

    const agentB = request.agent(app);
    const userB = await registerAndLogin(agentB, { username: 'bob2', email: 'bob2@example.com' });

    const convRes = await agentA.post('/api/conversations').send({ participantId: userB._id });
    const conversationId = convRes.body.data.conversation._id;

    const sendRes = await agentA
      .post('/api/messages')
      .send({ conversationId, text: 'hello there' });
    expect(sendRes.status).toBe(201);

    const fetchAsB = await agentB.get(`/api/messages/${conversationId}`);
    expect(fetchAsB.status).toBe(200);
    expect(fetchAsB.body.data.messages).toHaveLength(1);
    expect(fetchAsB.body.data.messages[0].text).toBe('hello there');
  });

  test('rejects a user who is not a participant from reading messages', async () => {
    const agentA = request.agent(app);
    const userA = await registerAndLogin(agentA, { username: 'alice3', email: 'alice3@example.com' });
    const agentB = request.agent(app);
    const userB = await registerAndLogin(agentB, { username: 'bob3', email: 'bob3@example.com' });
    const agentC = request.agent(app);
    await registerAndLogin(agentC, { username: 'carol', email: 'carol@example.com' });

    const convRes = await agentA.post('/api/conversations').send({ participantId: userB._id });
    const conversationId = convRes.body.data.conversation._id;

    const res = await agentC.get(`/api/messages/${conversationId}`);
    expect(res.status).toBe(403);
  });

  test('only the sender can edit their own message', async () => {
    const agentA = request.agent(app);
    const userA = await registerAndLogin(agentA, { username: 'alice4', email: 'alice4@example.com' });
    const agentB = request.agent(app);
    const userB = await registerAndLogin(agentB, { username: 'bob4', email: 'bob4@example.com' });

    const convRes = await agentA.post('/api/conversations').send({ participantId: userB._id });
    const conversationId = convRes.body.data.conversation._id;
    const msgRes = await agentA.post('/api/messages').send({ conversationId, text: 'original' });
    const messageId = msgRes.body.data.message._id;

    // Sender can edit
    const editBySender = await agentA.put(`/api/messages/${messageId}`).send({ text: 'edited' });
    expect(editBySender.status).toBe(200);
    expect(editBySender.body.data.message.edited).toBe(true);

    // Non-sender cannot
    const editByOther = await agentB.put(`/api/messages/${messageId}`).send({ text: 'hacked' });
    expect(editByOther.status).toBe(403);
  });

  test('deleting for everyone clears the text; only sender may do it', async () => {
    const agentA = request.agent(app);
    const userA = await registerAndLogin(agentA, { username: 'alice5', email: 'alice5@example.com' });
    const agentB = request.agent(app);
    const userB = await registerAndLogin(agentB, { username: 'bob5', email: 'bob5@example.com' });

    const convRes = await agentA.post('/api/conversations').send({ participantId: userB._id });
    const conversationId = convRes.body.data.conversation._id;
    const msgRes = await agentA.post('/api/messages').send({ conversationId, text: 'secret' });
    const messageId = msgRes.body.data.message._id;

    const deleteByOther = await agentB.delete(`/api/messages/${messageId}?mode=everyone`);
    expect(deleteByOther.status).toBe(403);

    const deleteBySender = await agentA.delete(`/api/messages/${messageId}?mode=everyone`);
    expect(deleteBySender.status).toBe(200);
    expect(deleteBySender.body.data.message.deleted.forEveryone).toBe(true);
    expect(deleteBySender.body.data.message.text).toBe('');
  });
});
