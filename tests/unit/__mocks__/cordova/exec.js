const execMock = jest.fn();

function exec (success, fail, service, action, args) {
    execMock({ success, fail, service, action, args });

    if (success) {
        success({ ok: true, service, action, args });
    }
}

exec.mock = execMock;
exec.reset = () => execMock.mockReset();
exec.lastCall = () => execMock.mock.calls[0]?.[0];

module.exports = exec;
