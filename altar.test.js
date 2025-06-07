// altar.test.js

// Mocking DOM elements and functions used in altar.js
const mockSolanaRpcInput = { value: 'https://default.solana.rpc/mock_key', tagName: 'INPUT' };
const mockBaseRpcInput = { value: 'https://default.base.rpc/mock', tagName: 'INPUT' };
const mockWalletAddressInput = { value: 'mockWalletAddress', tagName: 'INPUT' };
const mockUpdateButton = { addEventListener: jest.fn(), tagName: 'BUTTON' };
const mockTotalBurnedElem = { textContent: '', tagName: 'P' };
const mockLastTxIdElem = { textContent: '', tagName: 'SPAN' };
const mockCanvas = {
    getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        fill: jest.fn(),
        arc: jest.fn(),
    })),
    offsetWidth: 500,
    width: 0,
    height: 0,
    tagName: 'CANVAS',
};

global.document = {
    getElementById: jest.fn((id) => {
        switch (id) {
            case 'solana-rpc-url':
                return mockSolanaRpcInput;
            case 'base-rpc-url':
                return mockBaseRpcInput;
            case 'wallet-address':
                return mockWalletAddressInput;
            case 'update-settings-button':
                return mockUpdateButton;
            case 'total-burned':
                return mockTotalBurnedElem;
            case 'last-tx-id':
                return mockLastTxIdElem;
            case 'fire-canvas':
                return mockCanvas;
            default:
                return null;
        }
    }),
    addEventListener: jest.fn(), // For 'DOMContentLoaded'
};

global.requestAnimationFrame = jest.fn((cb) => cb()); // Immediately invoke callback
global.console = { log: jest.fn(), error: jest.fn() };

// Dynamically import altar.js after mocks are set up
let altarModule;

describe('Altar Initialization', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset textContent for elements that are updated
        mockTotalBurnedElem.textContent = '';
        mockLastTxIdElem.textContent = '';

        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback = global.document.addEventListener.mock.calls.find(
            (call) => call[0] === 'DOMContentLoaded'
        )[1];
        DOMContentLoadedCallback();
    });

    test('should initialize event listeners and log readiness', () => {
        expect(global.document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
        expect(global.console.log).toHaveBeenCalledWith('Altar is ready.');
    });

    test('should get references to settings input fields and button', () => {
        expect(global.document.getElementById).toHaveBeenCalledWith('solana-rpc-url');
        expect(global.document.getElementById).toHaveBeenCalledWith('base-rpc-url');
        expect(global.document.getElementById).toHaveBeenCalledWith('wallet-address');
        expect(global.document.getElementById).toHaveBeenCalledWith('update-settings-button');
    });

    test('should add event listener to update-settings-button', () => {
        expect(mockUpdateButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should log error if update settings button is not found', () => {
        const originalGetElementById = global.document.getElementById;
        global.document.getElementById = jest.fn((id) => (id === 'update-settings-button' ? null : originalGetElementById(id)));

        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback = global.document.addEventListener.mock.calls.find(
            (call) => call[0] === 'DOMContentLoaded'
        )[1];
        DOMContentLoadedCallback();

        expect(global.console.error).toHaveBeenCalledWith('Update settings button not found.');
        global.document.getElementById = originalGetElementById; // Restore
    });

    test('should call fetchBurnStats and renderFire on DOMContentLoaded', () => {
        expect(global.console.log).toHaveBeenCalledWith(`Fetching burn stats for wallet: ${mockWalletAddressInput.value}`);
        expect(global.console.log).toHaveBeenCalledWith('Enhanced fire animation started.');
    });
});

describe('fetchBurnStats', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockTotalBurnedElem.textContent = '';
        mockLastTxIdElem.textContent = '';

        // It's important to re-isolate modules and re-trigger DOMContentLoaded
        // if the module under test relies on initial setup based on these mocks.
        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback = global.document.addEventListener.mock.calls.find(
            (call) => call[0] === 'DOMContentLoaded'
        )[1];
        DOMContentLoadedCallback();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    test('should read RPC URLs and wallet address from input fields', async () => {
        // fetchBurnStats is called on init, so logs should reflect initial mock values
        expect(global.console.log).toHaveBeenCalledWith(`Fetching burn stats for wallet: ${mockWalletAddressInput.value}`);
        expect(global.console.log).toHaveBeenCalledWith(`Using Solana RPC: ${mockSolanaRpcInput.value}`);
        expect(global.console.log).toHaveBeenCalledWith(`Using Base RPC: ${mockBaseRpcInput.value}`);

        // Simulate changing input values
        mockSolanaRpcInput.value = 'new-solana-url';
        mockBaseRpcInput.value = 'new-base-url';
        mockWalletAddressInput.value = 'new-wallet';

        // Simulate button click to trigger fetchBurnStats again
        const clickCallback = mockUpdateButton.addEventListener.mock.calls.find(
            (call) => call[0] === 'click'
        )[1];
        clickCallback();

        // Now check if the new values are logged
        expect(global.console.log).toHaveBeenCalledWith('Fetching burn stats for wallet: new-wallet');
        expect(global.console.log).toHaveBeenCalledWith('Using Solana RPC: new-solana-url');
        expect(global.console.log).toHaveBeenCalledWith('Using Base RPC: new-base-url');
    });

    test('should call fetchBurnStats when update-settings-button is clicked', () => {
        const clickCallback = mockUpdateButton.addEventListener.mock.calls.find(
            (call) => call[0] === 'click'
        )[1];

        global.console.log.mockClear(); // Clear initial call logs from DOMContentLoaded
        clickCallback(); // Simulate button click

        expect(global.console.log).toHaveBeenCalledWith(`Fetching burn stats for wallet: ${mockWalletAddressInput.value}`);
    });

    test('should handle missing configuration DOM elements gracefully during fetch', async () => {
        const originalGetElementById = global.document.getElementById;
        global.document.getElementById = jest.fn((id) => {
            if (['solana-rpc-url', 'base-rpc-url', 'wallet-address'].includes(id)) return null;
            return originalGetElementById(id);
        });

        // Re-initialize module and trigger DOMContentLoaded to simulate the missing elements scenario from the start
        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback = global.document.addEventListener.mock.calls.find(
            (call) => call[0] === 'DOMContentLoaded'
        )[1];
        DOMContentLoadedCallback(); // This will call fetchBurnStats

        expect(global.console.error).toHaveBeenCalledWith('One or more required DOM elements are missing for fetching stats.');
        expect(mockTotalBurnedElem.textContent).toBe('Configuration error.');
        expect(mockLastTxIdElem.textContent).toBe('N/A');
        
        global.document.getElementById = originalGetElementById; // Restore
    });


    test('should update DOM with fetched stats on successful API simulation', async () => {
        jest.advanceTimersByTime(1200); // Longest timeout in fetchBurnStats
        await Promise.resolve(); 
        await Promise.resolve();

        expect(mockTotalBurnedElem.textContent).toMatch(/Tokens Burned \(Solana \+ Base\)$/);
        expect(mockLastTxIdElem.textContent).toMatch(/^0x(sol|base)[a-f0-9]+$/);
        expect(global.console.log).toHaveBeenCalledWith('Burn stats updated:', expect.any(Object));
    });

    test('should handle errors and update DOM accordingly when API simulation fails', async () => {
        const originalMathRandom = Math.random;
        Math.random = () => 0.05; // Force failure

        // Re-trigger DOMContentLoaded and thus fetchBurnStats with the new Math.random
        // Need to re-isolate to ensure the altar.js module re-evaluates and picks up the new Math.random
        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback = global.document.addEventListener.mock.calls.find(
            (call) => call[0] === 'DOMContentLoaded'
        )[1];
        DOMContentLoadedCallback();

        jest.advanceTimersByTime(1200);
        await Promise.resolve();
        await Promise.resolve();

        expect(mockTotalBurnedElem.textContent).toBe('Error loading stats.');
        expect(mockLastTxIdElem.textContent).toBe('N/A');
        expect(global.console.error).toHaveBeenCalledWith('Error fetching burn stats:', expect.stringContaining('Simulated failure'));

        Math.random = originalMathRandom; // Restore
    });

    test('should periodically call fetchBurnStats', () => {
        // Count how many times the core fetching message appears
        const fetchLogMessage = `Fetching burn stats for wallet: ${mockWalletAddressInput.value}`;
        let initialCallCount = global.console.log.mock.calls.filter(call => call[0] === fetchLogMessage).length;
        expect(initialCallCount).toBe(1); // Initial call on DOMContentLoaded

        jest.advanceTimersByTime(30000); // Advance by 30 seconds
        let secondCallCount = global.console.log.mock.calls.filter(call => call[0] === fetchLogMessage).length;
        expect(secondCallCount).toBe(2); // Should be called again

        jest.advanceTimersByTime(30000); // Advance by another 30 seconds
        let thirdCallCount = global.console.log.mock.calls.filter(call => call[0] === fetchLogMessage).length;
        expect(thirdCallCount).toBe(3);
    });
});

describe('renderFire', () => {
    let mockContext;

    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks for renderFire specific tests
        mockContext = {
            clearRect: jest.fn(),
            beginPath: jest.fn(),
            fill: jest.fn(),
            arc: jest.fn(),
        };
        // Ensure getElementById for 'fire-canvas' returns the mockCanvas with the mockContext
        global.document.getElementById = jest.fn((id) => {
            if (id === 'fire-canvas') {
                return {
                    ...mockCanvas, // spread existing mockCanvas properties
                    getContext: jest.fn(() => mockContext), // ensure getContext returns the fresh mockContext
                };
            }
            // Return other mocks as previously defined for other tests if necessary
            switch (id) {
                case 'solana-rpc-url': return mockSolanaRpcInput;
                case 'base-rpc-url': return mockBaseRpcInput;
                case 'wallet-address': return mockWalletAddressInput;
                case 'update-settings-button': return mockUpdateButton;
                case 'total-burned': return mockTotalBurnedElem;
                case 'last-tx-id': return mockLastTxIdElem;
                default: return null;
            }
        });

        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback = global.document.addEventListener.mock.calls.find(
            (call) => call[0] === 'DOMContentLoaded'
        )[1];
        DOMContentLoadedCallback();
    });

    test('should get canvas context and start animation', () => {
        expect(global.document.getElementById).toHaveBeenCalledWith('fire-canvas');
        // Check if getContext was called on the object returned for 'fire-canvas'
        const canvasMock = global.document.getElementById('fire-canvas');
        expect(canvasMock.getContext).toHaveBeenCalledWith('2d');
        expect(global.console.log).toHaveBeenCalledWith('Enhanced fire animation started.');
        expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('should draw particles on canvas', () => {
        expect(mockContext.clearRect).toHaveBeenCalled();
        expect(mockContext.beginPath).toHaveBeenCalledTimes(150); // particleCount
        expect(mockContext.arc).toHaveBeenCalledTimes(150);
        expect(mockContext.fill).toHaveBeenCalledTimes(150);
    });

    test('should handle canvas not being found or supported', () => {
        const originalGetElementById = global.document.getElementById;
        global.document.getElementById = jest.fn(id => (id === 'fire-canvas' ? null : originalGetElementById(id)));
        
        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback = global.document.addEventListener.mock.calls.find(
            call => call[0] === 'DOMContentLoaded'
        )[1];
        DOMContentLoadedCallback();

        expect(global.console.error).toHaveBeenCalledWith('Canvas not supported or not found.');
        global.document.getElementById = originalGetElementById; // Restore
    });
});
