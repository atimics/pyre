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
    beforeEach(() => {
        jest.useFakeTimers();
        jest.isolateModules(() => {
            altarModule = require('./pyre-ui/altar.js');
        });
        const DOMContentLoadedCallback =
            global.document.addEventListener.mock.calls.find(
                (call) => call[0] === 'DOMContentLoaded'
            )[1];
        DOMContentLoadedCallback();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    test('should update DOM with fetched stats on successful API simulation', async () => {
        // Fast-forward timers to resolve promises in fetchBurnStats
        jest.advanceTimersByTime(1200); // Longest timeout in fetchBurnStats

        // Allow microtasks (awaits) to complete
        await Promise.resolve();
        await Promise.resolve();

        expect(
            global.document.getElementById('total-burned').textContent
        ).toMatch(/Tokens Burned \(Solana \+ Base\)$/);
        expect(
            global.document.getElementById('last-tx-id').textContent
        ).toMatch(/^0x(sol|base)[a-f0-9]+$/);
        expect(global.console.log).toHaveBeenCalledWith(
            'Burn stats updated:',
            expect.any(Object)
        );
    });

    test('should handle errors and update DOM accordingly when API simulation fails', async () => {
        // Mock Math.random to ensure failures
        const originalMathRandom = Math.random;
        Math.random = () => 0.05; // Force failure (since threshold is 0.1)

        // Re-trigger DOMContentLoaded to call fetchBurnStats with the new Math.random
        const DOMContentLoadedCallback =
            global.document.addEventListener.mock.calls.find(
                (call) => call[0] === 'DOMContentLoaded'
            )[1];
        DOMContentLoadedCallback();

        jest.advanceTimersByTime(1200);
        await Promise.resolve();
        await Promise.resolve();

        expect(global.document.getElementById('total-burned').textContent).toBe(
            'Error loading stats.'
        );
        expect(global.document.getElementById('last-tx-id').textContent).toBe(
            'N/A'
        );
        expect(global.console.error).toHaveBeenCalledWith(
            'Error fetching burn stats:',
            expect.any(String)
        );

        Math.random = originalMathRandom; // Restore Math.random
    });

    test('should periodically call fetchBurnStats', () => {
        expect(global.console.log).toHaveBeenCalledWith(
            'Fetching burn stats...'
        ); // Initial call
        jest.advanceTimersByTime(30000); // Advance by 30 seconds
        expect(global.console.log).toHaveBeenCalledTimes(2); // Should be called again
        expect(global.console.log).toHaveBeenLastCalledWith(
            'Fetching burn stats...'
        );
        jest.advanceTimersByTime(30000); // Advance by another 30 seconds
        expect(global.console.log).toHaveBeenCalledTimes(3);
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
