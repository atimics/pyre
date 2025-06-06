// altar.test.js

// Mocking DOM elements and functions used in altar.js
global.document = {
    getElementById: jest.fn((id) => ({
        textContent: '',
        getContext: jest.fn(() => ({
            clearRect: jest.fn(),
            beginPath: jest.fn(),
            fill: jest.fn(),
            arc: jest.fn(),
            offsetWidth: 500, // Mock canvas width
        })),
        width: 0, // Mock canvas width, will be set by offsetWidth
        height: 0, // Mock canvas height
    })),
    addEventListener: jest.fn(),
};
global.requestAnimationFrame = jest.fn((cb) => cb()); // Immediately invoke callback
global.console = { log: jest.fn(), error: jest.fn() };
global.fetch = jest.fn();

// Dynamically import altar.js after mocks are set up
let altarModule;

describe('Altar Initialization', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Set up a fresh module for each test to avoid state leakage
        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        // Trigger DOMContentLoaded manually
        const DOMContentLoadedCallback =
            global.document.addEventListener.mock.calls.find(
                (call) => call[0] === 'DOMContentLoaded'
            )[1];
        DOMContentLoadedCallback();
    });

    test('should initialize event listeners and log readiness', () => {
        expect(global.document.addEventListener).toHaveBeenCalledWith(
            'DOMContentLoaded',
            expect.any(Function)
        );
        expect(global.console.log).toHaveBeenCalledWith('Altar is ready.');
    });

    test('should call fetchBurnStats and renderFire on DOMContentLoaded', () => {
        // These are async, but our mocks make them effectively synchronous for testing setup
        expect(global.console.log).toHaveBeenCalledWith(
            'Fetching burn stats...'
        );
        expect(global.console.log).toHaveBeenCalledWith(
            'Enhanced fire animation started.'
        );
    });
});

describe('fetchBurnStats', () => {
    const mockSolanaRpcUrl = 'https://api.mainnet-beta.solana.com';
    const mockBaseRpcUrl = 'https://mainnet.base.org';
    let domContentLoadedCallback;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks(); // Clear all mocks, including global.fetch

        // Mock getElementById to return distinct mocks for each ID for clarity
        global.document.getElementById = jest.fn((id) => {
            if (id === 'total-burned') {
                return { textContent: '' };
            }
            if (id === 'last-tx-id') {
                return { textContent: '' };
            }
            if (id === 'fire-canvas') {
                return {
                    getContext: jest.fn(() => ({
                        clearRect: jest.fn(),
                        beginPath: jest.fn(),
                        fill: jest.fn(),
                        arc: jest.fn(),
                        // ... other context methods if needed
                    })),
                    offsetWidth: 500,
                    width: 0,
                    height: 0,
                };
            }
            return { textContent: '' }; // Default mock
        });

        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });

        // Find the DOMContentLoaded callback added by altar.js
        const domEventCall = global.document.addEventListener.mock.calls.find(
            (call) => call[0] === 'DOMContentLoaded'
        );
        if (domEventCall && typeof domEventCall[1] === 'function') {
            domContentLoadedCallback = domEventCall[1];
        } else {
            // Fallback or error if altar.js didn't add the listener as expected
            // This can happen if altar.js changes its initialization logic
            // Forcing a simple callback for test setup if needed:
            domContentLoadedCallback = () => {
                // Manually call functions if direct callback isn't found/suitable
                if (altarModule && altarModule.fetchBurnStats) altarModule.fetchBurnStats();
                if (altarModule && altarModule.renderFire) altarModule.renderFire();
            };
            // console.warn("DOMContentLoaded callback not found directly, using fallback for test setup.");
        }
        // Initial call to simulate DOMContentLoaded
        domContentLoadedCallback();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should update DOM with fetched stats on successful RPC calls', async () => {
        global.fetch
            .mockResolvedValueOnce({ // Solana
                ok: true,
                json: async () => ({
                    // Assuming a simplified structure based on what altar.js might expect
                    // This needs to align with how altar.js will parse it.
                    // For example, if it expects a specific Solana structure:
                    totalBurnedOnSolana: 750000,
                    lastTxIdSolana: 'solTxSuccess123',
                }),
            })
            .mockResolvedValueOnce({ // Base
                ok: true,
                json: async () => ({
                    totalBurnedOnBase: 250000,
                    lastTxIdBase: 'baseTxSuccess456',
                }),
            });

        // Re-run fetchBurnStats (DOMContentLoaded already called it once)
        // Need to access the exported/internal function if possible, or re-trigger DOMContentLoaded
        // For simplicity, assuming fetchBurnStats is accessible or re-triggering DOMContentLoaded works
        // If altar.js is structured with fetchBurnStats inside DOMContentLoaded,
        // we might need to expose it for easier testing or rely on the interval.

        // Let's advance timers to trigger the first setInterval if that's easier
        // Or, if fetchBurnStats is globally accessible from altarModule for testing:
        // await altarModule.fetchBurnStats(); // This depends on altar.js structure

        // The initial call from DOMContentLoaded should have already happened.
        // We need to wait for the promises within that initial call to resolve.
        await Promise.resolve(); // Allow fetch mocks to be processed
        await Promise.resolve(); // Allow .json() promises
        await Promise.resolve(); // Allow further promise chain in try block

        expect(global.fetch).toHaveBeenCalledWith(mockSolanaRpcUrl, expect.any(Object));
        expect(global.fetch).toHaveBeenCalledWith(mockBaseRpcUrl, expect.any(Object));

        expect(global.document.getElementById('total-burned').textContent).toBe(
            '1,000,000 Tokens Burned (Solana + Base)'
        );
        expect(global.document.getElementById('last-tx-id').textContent).toBe(
            'solTxSuccess123' // As per current logic in altar.js
        );
        expect(global.console.log).toHaveBeenCalledWith('Burn stats updated:', {
            totalBurned: 1000000,
            lastTxId: 'solTxSuccess123',
        });
    });

    test('should handle network errors from RPC calls and update DOM', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network failed for Solana'));
        // Second call for Base could succeed or fail, let's make it succeed for this test
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ totalBurnedOnBase: 2000, lastTxIdBase: 'baseTxNetErrorCase' }),
        });


        // The initial call from DOMContentLoaded will trigger fetches.
        // Need to wait for promises to settle.
        await Promise.resolve(); // fetch for Solana rejects
        await Promise.resolve(); // fetch for Base resolves
        await Promise.resolve(); // .json() for Base
        await Promise.resolve(); // try/catch block in fetchBurnStats

        expect(global.document.getElementById('total-burned').textContent).toBe(
            'Error loading stats.'
        );
        expect(global.document.getElementById('last-tx-id').textContent).toBe('N/A');
        expect(global.console.error).toHaveBeenCalledWith(
            'Error fetching burn stats:',
            'Network failed for Solana' // Or whatever the first error is
        );
    });

    test('should handle API errors (non-ok response) from RPC calls', async () => {
        global.fetch
            .mockResolvedValueOnce({ // Solana API error
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({ error: 'Solana RPC error' }),
            })
            .mockResolvedValueOnce({ // Base success
                ok: true,
                json: async () => ({ totalBurnedOnBase: 3000, lastTxIdBase: 'baseTxApiErrorCase' }),
            });

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(global.document.getElementById('total-burned').textContent).toBe(
            'Error loading stats.'
        );
        expect(global.document.getElementById('last-tx-id').textContent).toBe('N/A');
        expect(global.console.error).toHaveBeenCalledWith(
            'Error fetching burn stats:',
            'Solana API Error: 500 Internal Server Error' // Or similar, depending on altar.js impl
        );
    });


    test('should periodically call fetchBurnStats', async () => {
        global.fetch.mockResolvedValue({ // Generic success for periodic calls
            ok: true,
            json: async () => ({ totalBurnedOnSolana: 1, lastTxIdSolana: 'solPeriodic', totalBurnedOnBase: 1, lastTxIdBase: 'basePeriodic' }),
        });

        // Initial call happened in beforeEach via DOMContentLoadedCallback
        expect(global.fetch).toHaveBeenCalledTimes(2); // Once for Solana, once for Base

        jest.advanceTimersByTime(30000); // Advance by 30 seconds
        await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); // For the two fetches and their .json() and try/catch

        expect(global.fetch).toHaveBeenCalledTimes(4); // Called again for Solana and Base
        expect(global.console.log).toHaveBeenLastCalledWith('Fetching burn stats...');


        jest.advanceTimersByTime(30000); // Advance by another 30 seconds
        await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

        expect(global.fetch).toHaveBeenCalledTimes(6);
    });
});

describe('renderFire', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = {
            clearRect: jest.fn(),
            beginPath: jest.fn(),
            fill: jest.fn(),
            arc: jest.fn(),
        };
        global.document.getElementById.mockReturnValue({
            getContext: jest.fn(() => mockContext),
            offsetWidth: 500,
            width: 0,
            height: 0,
        });

        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback =
            global.document.addEventListener.mock.calls.find(
                (call) => call[0] === 'DOMContentLoaded'
            )[1];
        DOMContentLoadedCallback();
    });

    test('should get canvas context and start animation', () => {
        expect(global.document.getElementById).toHaveBeenCalledWith(
            'fire-canvas'
        );
        expect(
            global.document.getElementById('fire-canvas').getContext
        ).toHaveBeenCalledWith('2d');
        expect(global.console.log).toHaveBeenCalledWith(
            'Enhanced fire animation started.'
        );
        expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('should draw particles on canvas', () => {
        // requestAnimationFrame is mocked to call the callback immediately
        // This means the draw() function within renderFire has been called once.
        expect(mockContext.clearRect).toHaveBeenCalled();
        expect(mockContext.beginPath).toHaveBeenCalledTimes(150); // particleCount
        expect(mock_context.arc).toHaveBeenCalledTimes(150);
        expect(mockContext.fill).toHaveBeenCalledTimes(150);
    });

    test('should handle canvas not being found or supported', () => {
        global.document.getElementById.mockReturnValueOnce(null); // Simulate canvas not found

        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback =
            global.document.addEventListener.mock.calls.find(
                (call) => call[0] === 'DOMContentLoaded'
            )[1];
        DOMContentLoadedCallback();

        expect(global.console.error).toHaveBeenCalledWith(
            'Canvas not supported or not found.'
        );
    });
});
