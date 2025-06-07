// altar.test.js

// Mocking DOM elements and functions used in altar.js
global.document = {
    getElementById: jest.fn((id) => {
        // Default mock for any ID
        const mockElement = {
            textContent: '',
            value: '', // For input elements
            getContext: jest.fn(() => ({
                clearRect: jest.fn(),
                beginPath: jest.fn(),
                fill: jest.fn(),
                arc: jest.fn(),
            })),
            addEventListener: jest.fn(), // For the button
            offsetWidth: 500, // Mock canvas width
            width: 0,
            height: 0,
        };

        // Specific values for config inputs
        if (id === 'solana-rpc-url') {
            mockElement.value = 'https://test-solana-rpc.com/?api-key=TEST_KEY';
        } else if (id === 'base-rpc-url') {
            mockElement.value = 'https://test-base-rpc.com';
        } else if (id === 'wallet-address') {
            mockElement.value = '0xtestWalletAddress';
        }

        return mockElement;
    }),
    addEventListener: jest.fn(),
};
global.requestAnimationFrame = jest.fn((cb) => cb()); // Immediately invoke callback
global.console = { log: jest.fn(), error: jest.fn() };
global.fetch = jest.fn();

// Dynamically import altar.js after mocks are set up
let altarModule;
let domContentLoadedCallback;

function setupAltarModule() {
    jest.isolateModules(() => {
        altarModule = require('./pyre-ui/altar.js');
    });
    // Trigger DOMContentLoaded manually
    const domEventCall = global.document.addEventListener.mock.calls.find(
        (call) => call[0] === 'DOMContentLoaded'
    );
    if (domEventCall && typeof domEventCall[1] === 'function') {
        domContentLoadedCallback = domEventCall[1];
        domContentLoadedCallback();
    } else {
        throw new Error('DOMContentLoaded listener not found or not a function. altar.js might have changed.');
    }
}


describe('Altar Initialization and Configuration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAltarModule();
    });

    test('should initialize event listeners and log readiness', () => {
        expect(global.document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
        expect(global.console.log).toHaveBeenCalledWith('Altar is ready.');
    });

    test('should get configuration elements and attach event listener to update button', () => {
        expect(global.document.getElementById).toHaveBeenCalledWith('solana-rpc-url');
        expect(global.document.getElementById).toHaveBeenCalledWith('base-rpc-url');
        expect(global.document.getElementById).toHaveBeenCalledWith('wallet-address');
        expect(global.document.getElementById).toHaveBeenCalledWith('update-settings-button');

        const updateButtonMock = global.document.getElementById('update-settings-button');
        expect(updateButtonMock.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should call fetchBurnStats and renderFire on DOMContentLoaded', () => {
        // fetchBurnStats is called, which in turn calls console.log
        expect(global.console.log).toHaveBeenCalledWith('Fetching burn stats for wallet: 0xtestWalletAddress');
        expect(global.console.log).toHaveBeenCalledWith('Enhanced fire animation started.');
    });

    test('clicking update settings button should call fetchBurnStats', () => {
        const updateButtonMock = global.document.getElementById('update-settings-button');
        // Find the click listener attached by altar.js
        const clickCallback = updateButtonMock.addEventListener.mock.calls.find(call => call[0] === 'click')[1];

        // Clear previous console log calls to isolate this specific call
        global.console.log.mockClear();
        global.fetch.mockClear(); // Clear fetch calls from initial load

        // Simulate button click
        clickCallback();

        expect(global.console.log).toHaveBeenCalledWith('Fetching burn stats for wallet: 0xtestWalletAddress');
        // Check if fetch was called as part of this button click (simulated fetch)
        // This assumes fetchBurnStats internally calls fetch, which it does (simulated)
        // For the simulated version, it doesn't use global.fetch directly but internal Promises
        // So we check the console log that indicates it started
    });
});

describe('fetchBurnStats with Configurable Settings', () => {
    // These will be read from the mocked input elements
    const expectedSolanaRpcUrl = 'https://test-solana-rpc.com/?api-key=TEST_KEY';
    const expectedBaseRpcUrl = 'https://test-base-rpc.com';
    const expectedWalletAddress = '0xtestWalletAddress';

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        // Set up specific values for inputs for these tests if different from default mock
        global.document.getElementById.mockImplementation((id) => {
            const baseMock = {
                textContent: '',
                value: '',
                getContext: jest.fn(() => ({ clearRect: jest.fn(), beginPath: jest.fn(), fill: jest.fn(), arc: jest.fn() })),
                addEventListener: jest.fn(),
                offsetWidth: 500, width: 0, height: 0,
            };
            if (id === 'solana-rpc-url') return { ...baseMock, value: expectedSolanaRpcUrl };
            if (id === 'base-rpc-url') return { ...baseMock, value: expectedBaseRpcUrl };
            if (id === 'wallet-address') return { ...baseMock, value: expectedWalletAddress };
            if (id === 'total-burned' || id === 'last-tx-id' || id === 'fire-canvas' || id === 'update-settings-button') return baseMock;
            return baseMock;
        });
        setupAltarModule(); // This will call fetchBurnStats once
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should use RPC URLs and wallet address from input fields', async () => {
        // The initial call in setupAltarModule already happened.
        // We check the console logs from that initial call.
        expect(global.console.log).toHaveBeenCalledWith(`Fetching burn stats for wallet: ${expectedWalletAddress}`);
        expect(global.console.log).toHaveBeenCalledWith(`Using Solana RPC: ${expectedSolanaRpcUrl}`);
        expect(global.console.log).toHaveBeenCalledWith(`Using Base RPC: ${expectedBaseRpcUrl}`);

        // Further tests will assume these values are used when actual fetch is implemented
        // For now, the simulated fetch doesn't use them, but the logging confirms they are read.
    });

    test('should update DOM with fetched stats on successful API simulation', async () => {
        // The simulated fetch in altar.js uses setTimeout
        jest.advanceTimersByTime(1200); // Longest timeout in simulated fetchBurnStats

        // Allow microtasks (awaits in try/catch) to complete
        await Promise.resolve();
        await Promise.resolve();

        const totalBurnedEl = global.document.getElementById('total-burned');
        const lastTxIdEl = global.document.getElementById('last-tx-id');

        expect(totalBurnedEl.textContent).toMatch(/Tokens Burned \\(Solana \\+ Base\\)$/);
        expect(lastTxIdEl.textContent).toMatch(/^0x(sol|base)[a-f0-9]+$/);
        expect(global.console.log).toHaveBeenCalledWith('Burn stats updated:', expect.any(Object));
    });

    test('should handle errors and update DOM accordingly when API simulation fails', async () => {
        // Override Math.random for this test to force failure
        const originalMathRandom = Math.random;
        Math.random = () => 0.05; // Force failure (simulated API fails if Math.random() <= 0.1)

        // Re-run fetchBurnStats by simulating button click
        const updateButtonMock = global.document.getElementById('update-settings-button');
        const clickCallback = updateButtonMock.addEventListener.mock.calls.find(call => call[0] === 'click')[1];
        
        global.console.error.mockClear(); // Clear previous errors
        clickCallback(); // This will call fetchBurnStats again

        jest.advanceTimersByTime(1200);
        await Promise.resolve();
        await Promise.resolve();

        const totalBurnedEl = global.document.getElementById('total-burned');
        const lastTxIdEl = global.document.getElementById('last-tx-id');

        expect(totalBurnedEl.textContent).toBe('Error loading stats.');
        expect(lastTxIdEl.textContent).toBe('N/A');
        expect(global.console.error).toHaveBeenCalledWith('Error fetching burn stats:', expect.stringContaining('Simulated failure'));

        Math.random = originalMathRandom; // Restore Math.random
    });
    
    test('should periodically call fetchBurnStats', () => {
        // Initial call happened in setupAltarModule
        expect(global.console.log).toHaveBeenCalledWith(`Fetching burn stats for wallet: ${expectedWalletAddress}`);
        const initialCallCount = global.console.log.mock.calls.filter(
            c => c[0].startsWith('Fetching burn stats for wallet:')
        ).length;

        jest.advanceTimersByTime(30000); // Advance by 30 seconds
        
        const afterFirstIntervalCount = global.console.log.mock.calls.filter(
            c => c[0].startsWith('Fetching burn stats for wallet:')
        ).length;
        expect(afterFirstIntervalCount).toBe(initialCallCount + 1);

        jest.advanceTimersByTime(30000); // Advance by another 30 seconds
        const afterSecondIntervalCount = global.console.log.mock.calls.filter(
            c => c[0].startsWith('Fetching burn stats for wallet:')
        ).length;
        expect(afterSecondIntervalCount).toBe(initialCallCount + 2);
    });

    // Tests for actual fetch calls (currently commented out in previous versions)
    // will be adapted once altar.js uses global.fetch with these configurable URLs.
});

// ... (Keep the renderFire describe block as is, or adapt if it uses new config)
// For now, renderFire is independent of these settings.

describe('renderFire', () => {
    let mockContext;

    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks
        mockContext = {
            clearRect: jest.fn(),
            beginPath: jest.fn(),
            fill: jest.fn(),
            arc: jest.fn(),
        };
        // Reset getElementById mock for canvas specifically for renderFire tests
        global.document.getElementById = jest.fn((id) => {
            if (id === 'fire-canvas') {
                return {
                    getContext: jest.fn(() => mockContext),
                    offsetWidth: 500,
                    width: 0, // Will be set by offsetWidth
                    height: 0, // Will be set by fixed value or offsetHeight
                };
            }
            // Return minimal mocks for other elements if altar.js tries to access them during this test's setup
            return { value: '', textContent: '', addEventListener: jest.fn() };
        });
        setupAltarModule();
    });

    test('should get canvas context and start animation', () => {
        expect(global.document.getElementById).toHaveBeenCalledWith('fire-canvas');
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
        global.document.getElementById.mockImplementation((id) => {
            if (id === 'fire-canvas') return null; // Simulate canvas not found
            return { value: '', textContent: '', addEventListener: jest.fn() };
        });
        
        // Re-run setup because getElementById mock changed
        // Need to clear previous console errors to avoid false positives
        global.console.error.mockClear();
        setupAltarModule();

        expect(global.console.error).toHaveBeenCalledWith('Canvas not supported or not found.');
    });
});
