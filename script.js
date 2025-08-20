// GNSS Signal Modulation Explorer - JavaScript Functions

// Global variables
let animationId = null;
let currentCode = [];
let currentTime = 0;

// Helper function to get canvas dimensions
function getCanvasDimensions(canvas) {
    let rect = canvas.getBoundingClientRect();
    return {
        width: rect.width || 600,
        height: rect.height || 300
    };
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvases();
    
    // Add event listeners for all controls
    const modulationType = document.getElementById('modulationType');
    const carrierFreq = document.getElementById('carrierFreq');
    const dataRate = document.getElementById('dataRate');
    const snr = document.getElementById('snr');
    
    if (modulationType) modulationType.addEventListener('change', updateCarrierModulation);
    if (carrierFreq) carrierFreq.addEventListener('input', updateCarrierModulation);
    if (dataRate) dataRate.addEventListener('input', updateCarrierModulation);
    if (snr) snr.addEventListener('input', updateCarrierModulation);
    
    const bocType = document.getElementById('bocType');
    const subcarrierFreq = document.getElementById('subcarrierFreq');
    const bocChipRate = document.getElementById('bocChipRate');
    const bocPhase = document.getElementById('bocPhase');
    
    if (bocType) bocType.addEventListener('change', updateBOCModulation);
    if (subcarrierFreq) subcarrierFreq.addEventListener('input', updateBOCModulation);
    if (bocChipRate) bocChipRate.addEventListener('input', updateBOCModulation);
    if (bocPhase) bocPhase.addEventListener('change', updateBOCModulation);
    
    const signalType = document.getElementById('signalType');
    const showComponents = document.getElementById('showComponents');
    
    if (signalType) signalType.addEventListener('change', updateCombinedSignal);
    if (showComponents) showComponents.addEventListener('change', updateCombinedSignal);
    
    updateRangingCode();
    
    // Add small delay to ensure DOM is fully ready
    setTimeout(() => {
        updateCarrierModulation();
        updateBOCModulation();
        updateCombinedSignal();
    }, 100);
});

// Tab switching functionality
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked nav tab
    event.target.classList.add('active');
    
    // Cancel any running animations
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Reinitialize canvases and update content for the active tab
    setTimeout(() => {
        initializeCanvases();
        switch(tabName) {
            case 'ranging':
                updateRangingCode();
                break;
            case 'carrier':
                updateCarrierModulation();
                break;
            case 'boc':
                updateBOCModulation();
                break;
            case 'combined':
                updateCombinedSignal();
                break;
            case 'l1multiplexing':
                updateL1Multiplexing();
                break;
            case 'playground':
                updatePlayground();
                break;
        }
    }, 50);
}

// Initialize all canvases
function initializeCanvases() {
    const canvasIds = [
        'codeCanvas', 'correlationCanvas', 'carrierTimeCanvas', 'constellationCanvas',
        'spectrumCanvas', 'eyeCanvas', 'subcarrierCanvas', 'bocProductCanvas',
        'bocSpectrumCanvas', 'bocCorrelationCanvas', 'componentsCanvas',
        'finalSignalCanvas', 'receivedSignalCanvas', 'correlationProcessCanvas',
        'l1SpectrumCanvas', 'l1ConstellationCanvas', 'l1StructureCanvas',
        'inputSignalsCanvas', 'modulationProcessCanvas', 'finalOutputCanvas', 'analysisCanvas'
    ];
    
    canvasIds.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            // Set a fixed size if getBoundingClientRect returns 0
            let rect = canvas.getBoundingClientRect();
            let width = rect.width || 600;  // Default width
            let height = rect.height || 300;  // Default height
            
            // Set canvas size
            canvas.width = width * 2;
            canvas.height = height * 2;
            
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);
            
            // Clear with white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            
            // Add a border to show the canvas is working
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.strokeRect(1, 1, width - 2, height - 2);
            
            console.log(`Initialized canvas ${id}: ${width}x${height}`);
        } else {
            console.warn(`Canvas ${id} not found`);
        }
    });
}

// Ranging Code Functions
function generateCACode(prn = 1, length = 1023) {
    // Simplified C/A code generation using Linear Feedback Shift Register
    const g1_taps = [3, 10];
    const g2_taps = [2, 3, 6, 8, 9, 10];
    
    let g1 = Array(10).fill(1);
    let g2 = Array(10).fill(1);
    let code = [];
    
    // G2 delay mapping for different PRNs
    const g2_delays = [
        [2, 6], [3, 7], [4, 8], [5, 9], [1, 9], [2, 10], [1, 8], [2, 9],
        [3, 10], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
        [1, 4], [2, 5], [3, 6], [4, 7], [5, 8], [6, 9], [1, 3], [4, 6],
        [5, 7], [6, 8], [7, 9], [8, 10], [1, 6], [2, 7], [3, 8], [4, 9]
    ];
    
    for (let i = 0; i < length; i++) {
        // G1 feedback
        let g1_feedback = g1[2] ^ g1[9];
        
        // G2 feedback  
        let g2_feedback = g2[1] ^ g2[2] ^ g2[5] ^ g2[7] ^ g2[8] ^ g2[9];
        
        // Get G2 output based on PRN
        let g2_out = g2[g2_delays[prn % 32][0] - 1] ^ g2[g2_delays[prn % 32][1] - 1];
        
        // Generate code chip
        code[i] = g1[9] ^ g2_out ? 1 : -1;
        
        // Shift registers
        g1.unshift(g1_feedback);
        g1.pop();
        g2.unshift(g2_feedback);
        g2.pop();
    }
    
    return code;
}

function generatePRNSequence(length) {
    // Generate a simple pseudorandom sequence
    let sequence = [];
    let lfsr = 0x1;
    
    for (let i = 0; i < length; i++) {
        let bit = ((lfsr >> 0) ^ (lfsr >> 2) ^ (lfsr >> 3) ^ (lfsr >> 5)) & 1;
        sequence[i] = bit ? 1 : -1;
        lfsr = (lfsr >> 1) | (bit << 15);
    }
    
    return sequence;
}

function calculateAutocorrelation(code) {
    const n = code.length;
    let autocorr = [];
    
    for (let lag = -n + 1; lag < n; lag++) {
        let sum = 0;
        for (let i = 0; i < n; i++) {
            let j = i + lag;
            if (j >= 0 && j < n) {
                sum += code[i] * code[j];
            }
        }
        autocorr.push(sum / n);
    }
    
    return autocorr;
}

function updateRangingCode() {
    const codeType = document.getElementById('codeType').value;
    const codeLength = parseInt(document.getElementById('codeLength').value);
    const chipRate = parseFloat(document.getElementById('chipRate').value);
    
    // Update chip rate display
    document.getElementById('chipRateValue').textContent = chipRate + ' Mcps';
    
    // Generate code based on type
    switch(codeType) {
        case 'ca':
            currentCode = generateCACode(1, codeLength);
            break;
        case 'prn':
            currentCode = generatePRNSequence(codeLength);
            break;
        case 'gold':
            currentCode = generateCACode(Math.floor(Math.random() * 32), codeLength);
            break;
        case 'kasami':
            currentCode = generatePRNSequence(codeLength);
            break;
    }
    
    drawCodeSequence(chipRate);
    drawAutocorrelation();
    updateCodeDisplay(chipRate);
}

function drawCodeSequence(chipRate) {
    const canvas = document.getElementById('codeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw code sequence with adaptive chip display based on chip rate
    // Higher chip rates show fewer chips to maintain readability
    let visibleChips;
    if (chipRate <= 1) {
        visibleChips = Math.min(200, currentCode.length);
    } else if (chipRate <= 5) {
        visibleChips = Math.min(100, currentCode.length);
    } else {
        visibleChips = Math.min(50, currentCode.length);
    }
    
    const chipWidth = width / visibleChips;
    
    // Calculate timing information based on chip rate
    const chipDuration = 1 / (chipRate * 1e6); // seconds per chip
    const totalDuration = visibleChips * chipDuration * 1e6; // microseconds
    
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < visibleChips; i++) {
        const x = i * chipWidth;
        const y = height / 2 + (currentCode[i] * height / 4);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, height / 2 + (currentCode[i - 1] * height / 4));
            ctx.lineTo(x, y);
        }
        
        if (i < visibleChips - 1) {
            ctx.lineTo((i + 1) * chipWidth, y);
        }
    }
    
    ctx.stroke();
    
    // Add labels with timing information
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Chip Value', 10, 20);
    ctx.fillText('+1', 10, height / 4 + 5);
    ctx.fillText('0', 10, height / 2 + 5);
    ctx.fillText('-1', 10, 3 * height / 4 + 5);
    
    // Add timing and chip rate information
    ctx.fillText(`Chip Rate: ${chipRate} Mcps`, 10, height - 40);
    ctx.fillText(`Chip Duration: ${(chipDuration * 1e9).toFixed(1)} ns`, 10, height - 25);
    ctx.fillText(`Display Time: ${totalDuration.toFixed(1)} μs (${visibleChips} chips)`, 10, height - 10);
    
    // Draw time axis markers
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    const numTimeMarkers = 5;
    for (let i = 0; i <= numTimeMarkers; i++) {
        const x = (i / numTimeMarkers) * width;
        const timeValue = (i / numTimeMarkers) * totalDuration;
        
        // Draw tick mark
        ctx.beginPath();
        ctx.moveTo(x, height - 60);
        ctx.lineTo(x, height - 55);
        ctx.stroke();
        
        // Draw time label
        ctx.fillStyle = '#666666';
        ctx.font = '10px Arial';
        ctx.fillText(`${timeValue.toFixed(1)}μs`, x - 15, height - 45);
    }
}

function drawAutocorrelation() {
    const canvas = document.getElementById('correlationCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate autocorrelation
    const autocorr = calculateAutocorrelation(currentCode);
    const maxVal = Math.max(...autocorr.map(Math.abs));
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Draw autocorrelation
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < autocorr.length; i++) {
        const x = (i / autocorr.length) * width;
        const y = height / 2 - (autocorr[i] / maxVal) * (height / 2);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Add labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Correlation', 10, 20);
    ctx.fillText('Lag (chips)', width - 80, height - 10);
}

function updateCodeDisplay(chipRate) {
    const codeDisplay = document.getElementById('codeSequence');
    const displayLength = Math.min(50, currentCode.length);
    const codeStr = currentCode.slice(0, displayLength).map(c => c > 0 ? '1' : '0').join('');
    const moreChips = currentCode.length > displayLength ? '...' : '';
    
    // Calculate code period and repetition rate
    const codePeriod = currentCode.length / (chipRate * 1e6) * 1000; // milliseconds
    const repetitionRate = 1000 / codePeriod; // Hz
    
    let displayText = `Code (${currentCode.length} chips): ${codeStr}${moreChips}\n`;
    displayText += `Code Period: ${codePeriod.toFixed(3)} ms (${repetitionRate.toFixed(1)} Hz repetition)\n`;
    displayText += `Chip Rate: ${chipRate} Mcps, Chip Duration: ${(1/(chipRate*1e6)*1e9).toFixed(1)} ns`;
    
    codeDisplay.textContent = displayText;
}

function generateNewCode() {
    updateRangingCode();
}

// Carrier Modulation Functions
function updateCarrierModulation() {
    try {
        const modulationType = document.getElementById('modulationType').value;
        const carrierFreq = parseInt(document.getElementById('carrierFreq').value);
        const dataRate = parseInt(document.getElementById('dataRate').value);
        const snr = parseInt(document.getElementById('snr').value);
        
        // Update displays
        const carrierFreqEl = document.getElementById('carrierFreqValue');
        const dataRateEl = document.getElementById('dataRateValue');
        const snrEl = document.getElementById('snrValue');
        
        if (carrierFreqEl) carrierFreqEl.textContent = carrierFreq + ' MHz';
        if (dataRateEl) dataRateEl.textContent = dataRate + ' bps';
        if (snrEl) snrEl.textContent = snr + ' dB';
        
        drawCarrierSignal(modulationType, carrierFreq, dataRate, snr);
        drawConstellation(modulationType, snr);
        drawSpectrum(modulationType, dataRate);
        drawEyeDiagram(modulationType, dataRate, snr);
    } catch (error) {
        console.error('Error in updateCarrierModulation:', error);
    }
}

function drawCarrierSignal(modType, freq, dataRate, snr) {
    const canvas = document.getElementById('carrierTimeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    console.log(`Drawing carrier signal: ${width}x${height}`);
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Add a test marker to verify the function is working
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(10, 10, 20, 20);
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.fillText(`Carrier: ${modType}`, 40, 25);
    
    // Generate sample data bits
    const numBits = 8;
    const data = Array.from({length: numBits}, () => Math.random() > 0.5 ? 1 : -1);
    
    // Time parameters
    const bitDuration = 1 / dataRate * 1000; // ms
    const samplesPerBit = 100;
    const totalSamples = numBits * samplesPerBit;
    
    // Draw signal
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    for (let i = 0; i < totalSamples; i++) {
        const t = i / totalSamples * numBits * bitDuration;
        const bitIndex = Math.floor(i / samplesPerBit);
        const x = (i / totalSamples) * width;
        
        let signal = 0;
        switch(modType) {
            case 'bpsk':
                signal = data[bitIndex] * Math.cos(2 * Math.PI * freq * t / 1000);
                break;
            case 'qpsk':
                const iData = data[bitIndex];
                const qData = data[Math.min(bitIndex + 1, numBits - 1)];
                signal = iData * Math.cos(2 * Math.PI * freq * t / 1000) + 
                        qData * Math.sin(2 * Math.PI * freq * t / 1000);
                break;
            case 'msk':
                signal = Math.cos(2 * Math.PI * freq * t / 1000 + data[bitIndex] * Math.PI * t / (2 * bitDuration));
                break;
            case 'gmsk':
                // Simplified GMSK approximation
                signal = Math.cos(2 * Math.PI * freq * t / 1000 + data[bitIndex] * Math.PI * t / (2 * bitDuration));
                break;
        }
        
        // Add noise based on SNR
        const noise = (Math.random() - 0.5) * Math.pow(10, -snr / 20);
        signal += noise;
        
        const y = height / 2 - signal * height / 4;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Draw data bits overlay
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < numBits; i++) {
        const x1 = (i / numBits) * width;
        const x2 = ((i + 1) / numBits) * width;
        const y = height / 2 - data[i] * height / 6;
        
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
    }
    
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Modulated Signal', 10, 20);
    ctx.fillText('Data Bits', 10, 35);
}

function drawConstellation(modType, snr) {
    const canvas = document.getElementById('constellationCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw axes
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw constellation points
    const numPoints = 200;
    const noiseLevel = Math.pow(10, -snr / 20) * 0.3;
    
    ctx.fillStyle = '#2563eb';
    
    for (let i = 0; i < numPoints; i++) {
        let iVal = 0, qVal = 0;
        
        switch(modType) {
            case 'bpsk':
                iVal = Math.random() > 0.5 ? 1 : -1;
                qVal = 0;
                break;
            case 'qpsk':
                iVal = Math.random() > 0.5 ? 1 : -1;
                qVal = Math.random() > 0.5 ? 1 : -1;
                break;
            case 'msk':
            case 'gmsk':
                const phase = Math.random() * 2 * Math.PI;
                iVal = Math.cos(phase);
                qVal = Math.sin(phase);
                break;
        }
        
        // Add noise
        iVal += (Math.random() - 0.5) * noiseLevel;
        qVal += (Math.random() - 0.5) * noiseLevel;
        
        const x = width / 2 + iVal * width / 4;
        const y = height / 2 - qVal * height / 4;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Q', width / 2 + 5, 15);
    ctx.fillText('I', width - 15, height / 2 - 5);
}

function drawSpectrum(modType, dataRate) {
    const canvas = document.getElementById('spectrumCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Generate frequency response
    const freqPoints = 1000;
    const maxFreq = dataRate * 5; // Hz
    
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < freqPoints; i++) {
        const freq = (i / freqPoints - 0.5) * 2 * maxFreq;
        const x = (i / freqPoints) * width;
        
        let psd = 0;
        switch(modType) {
            case 'bpsk':
                psd = freq === 0 ? 1 : Math.pow(Math.sin(Math.PI * freq / dataRate) / (Math.PI * freq / dataRate), 2);
                break;
            case 'qpsk':
                psd = freq === 0 ? 1 : Math.pow(Math.sin(Math.PI * freq / (dataRate/2)) / (Math.PI * freq / (dataRate/2)), 2);
                break;
            case 'msk':
            case 'gmsk':
                const alpha = Math.PI * freq / (2 * dataRate);
                psd = Math.pow(Math.cos(alpha), 2) / (1 - Math.pow(2 * freq / dataRate, 2));
                if (isNaN(psd) || !isFinite(psd)) psd = 0;
                break;
        }
        
        const y = height - (psd * height * 0.8);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('PSD (dB)', 10, 20);
    ctx.fillText('Frequency (Hz)', width - 80, height - 10);
}

function drawEyeDiagram(modType, dataRate, snr) {
    const canvas = document.getElementById('eyeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Generate multiple traces
    const numTraces = 20;
    const samplesPerSymbol = 20;
    const noiseLevel = Math.pow(10, -snr / 20) * 0.1;
    
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.3)';
    ctx.lineWidth = 1;
    
    for (let trace = 0; trace < numTraces; trace++) {
        const data = Array.from({length: 3}, () => Math.random() > 0.5 ? 1 : -1);
        
        ctx.beginPath();
        
        for (let i = 0; i < 2 * samplesPerSymbol; i++) {
            const t = i / samplesPerSymbol - 1; // -1 to 1
            const x = (i / (2 * samplesPerSymbol)) * width;
            
            let signal = 0;
            if (t < 0) {
                signal = data[0];
            } else {
                signal = data[1];
            }
            
            // Apply pulse shaping
            if (modType === 'gmsk') {
                const gauss = Math.exp(-Math.pow(t * 2, 2));
                signal *= gauss;
            }
            
            // Add noise
            signal += (Math.random() - 0.5) * noiseLevel;
            
            const y = height / 2 - signal * height / 4;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    // Draw optimal sampling point
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Eye Diagram', 10, 20);
    ctx.fillText('Symbol Period', width / 2 - 40, height - 10);
}

// BOC Modulation Functions
function updateBOCModulation() {
    try {
        const bocType = document.getElementById('bocType').value;
        let subcarrierFreq = parseFloat(document.getElementById('subcarrierFreq').value);
        let chipRate = parseFloat(document.getElementById('bocChipRate').value);
        const phase = document.getElementById('bocPhase').value;
        
        // Only auto-set parameters when BOC type changes, not when sliders move
        if (window.lastBOCType !== bocType) {
            const bocParams = getBOCParameters(bocType);
            subcarrierFreq = bocParams.subcarrierFreq;
            chipRate = bocParams.chipRate;
            
            // Update sliders to reflect the BOC type parameters
            document.getElementById('subcarrierFreq').value = subcarrierFreq;
            document.getElementById('bocChipRate').value = chipRate;
            
            window.lastBOCType = bocType;
        }
        
        // Update displays
        const subcarrierFreqEl = document.getElementById('subcarrierFreqValue');
        const chipRateEl = document.getElementById('bocChipRateValue');
        
        if (subcarrierFreqEl) subcarrierFreqEl.textContent = subcarrierFreq + ' MHz';
        if (chipRateEl) chipRateEl.textContent = chipRate + ' Mcps';
        
        drawBOCSubcarrier(subcarrierFreq, phase, bocType);
        drawBOCProduct(subcarrierFreq, chipRate, phase, bocType);
        drawBOCSpectrum(subcarrierFreq, chipRate, bocType);
        drawBOCCorrelation(subcarrierFreq, chipRate, bocType);
        updateBOCInfo(bocType, subcarrierFreq, chipRate);
    } catch (error) {
        console.error('Error in updateBOCModulation:', error);
    }
}

// Update BOC information panel
function updateBOCInfo(bocType, currentSubcarrierFreq, currentChipRate) {
    const bocParams = getBOCParameters(bocType);
    const infoElement = document.getElementById('bocTypeInfo');
    
    if (infoElement) {
        let infoText = `${bocType.toUpperCase().replace(/_/g, '(')} - ${bocParams.description}\n`;
        infoText += `Current: ${currentSubcarrierFreq} MHz subcarrier, ${currentChipRate} Mcps chip rate\n`;
        infoText += `Standard: ${bocParams.subcarrierFreq} MHz subcarrier, ${bocParams.chipRate} Mcps chip rate\n`;
        
        // Add specific information for each BOC type
        switch(bocType) {
            case 'boc_1_1':
                infoText += `Used in Galileo E1 Open Service. Provides 1.023 MHz spectrum split.`;
                break;
            case 'boc_6_1':
                infoText += `Used in Galileo E1 PRS. Higher subcarrier frequency for better multipath resistance.`;
                break;
            case 'boc_10_5':
                infoText += `Used in GPS L1C. Higher chip rate improves ranging accuracy.`;
                break;
            case 'boc_15_2.5':
                infoText += `Used in Galileo E5a/E5b. Wideband signal with excellent performance.`;
                break;
            case 'mboc':
                infoText += `Multiplexed BOC combining BOC(1,1) and BOC(6,1) for optimized performance.`;
                break;
            case 'altboc':
                infoText += `Alternative BOC used in Galileo E5. Complex subcarrier modulation.`;
                break;
            default:
                infoText += `Enhanced BOC configuration for improved signal performance.`;
        }
        
        if (currentSubcarrierFreq !== bocParams.subcarrierFreq || currentChipRate !== bocParams.chipRate) {
            infoText += `\n\nNote: You've modified the standard parameters. Use sliders to experiment!`;
        }
        
        infoElement.textContent = infoText;
    }
}

// Get BOC parameters for different signal types
function getBOCParameters(bocType) {
    const params = {
        'boc_1_1': { subcarrierFreq: 1.023, chipRate: 1.023, description: 'Galileo E1 Open Service' },
        'boc_6_1': { subcarrierFreq: 6.138, chipRate: 1.023, description: 'Galileo E1 Public Regulated Service' },
        'boc_10_5': { subcarrierFreq: 10.23, chipRate: 5.115, description: 'GPS L1C' },
        'boc_15_2.5': { subcarrierFreq: 15.345, chipRate: 2.5575, description: 'Galileo E5a/E5b' },
        'mboc': { subcarrierFreq: 1.023, chipRate: 1.023, description: 'Multiplexed BOC' },
        'boc_1_1_sine': { subcarrierFreq: 1.023, chipRate: 1.023, description: 'BOC(1,1) Sine Phase' },
        'boc_2_1': { subcarrierFreq: 2.046, chipRate: 1.023, description: 'Enhanced Resolution BOC' },
        'boc_4_1': { subcarrierFreq: 4.092, chipRate: 1.023, description: 'High Precision BOC' },
        'altboc': { subcarrierFreq: 15.345, chipRate: 10.23, description: 'Galileo E5 AltBOC' }
    };
    
    return params[bocType] || params['boc_1_1'];
}

// Reset BOC parameters to standard values
function resetBOCToStandard() {
    const bocType = document.getElementById('bocType').value;
    const bocParams = getBOCParameters(bocType);
    
    // Reset sliders to standard values
    document.getElementById('subcarrierFreq').value = bocParams.subcarrierFreq;
    document.getElementById('bocChipRate').value = bocParams.chipRate;
    
    // Force update by clearing the last BOC type
    window.lastBOCType = null;
    
    // Update the display
    updateBOCModulation();
}

function drawBOCSubcarrier(freq, phase, bocType) {
    const canvas = document.getElementById('subcarrierCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Add test marker
    ctx.fillStyle = '#059669';
    ctx.fillRect(10, 10, 20, 20);
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.fillText(`BOC: ${freq}MHz ${phase}`, 40, 25);
    
    // Get BOC description
    const bocParams = getBOCParameters(bocType);
    ctx.font = '12px Arial';
    ctx.fillText(bocParams.description, 10, height - 10);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Draw subcarrier
    const numSamples = 1000;
    const periods = Math.max(2, Math.min(8, freq)); // Adaptive number of periods based on frequency
    
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < numSamples; i++) {
        const t = (i / numSamples) * periods / freq;
        const x = (i / numSamples) * width;
        
        let signal;
        
        // Handle special BOC types
        if (bocType === 'mboc') {
            // MBOC is a combination of BOC(1,1) and BOC(6,1)
            const boc11 = Math.sign(Math.sin(2 * Math.PI * 1.023 * t));
            const boc61 = Math.sign(Math.sin(2 * Math.PI * 6.138 * t));
            signal = 0.75 * boc11 + 0.25 * boc61; // Weighted combination
        } else if (bocType === 'altboc') {
            // AltBOC uses complex subcarriers
            const realPart = Math.sign(Math.cos(2 * Math.PI * freq * t));
            const imagPart = Math.sign(Math.sin(2 * Math.PI * freq * t));
            signal = realPart; // Display real part only
        } else {
            // Standard BOC
            if (phase === 'sine' || bocType === 'boc_1_1_sine') {
                signal = Math.sign(Math.sin(2 * Math.PI * freq * t));
            } else {
                signal = Math.sign(Math.cos(2 * Math.PI * freq * t));
            }
        }
        
        const y = height / 2 - signal * height / 4;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('BOC Subcarrier', 10, 20);
    ctx.fillText(`${freq} MHz ${phase}`, 10, 35);
}

function drawBOCProduct(subcarrierFreq, chipRate, phase, bocType) {
    const canvas = document.getElementById('bocProductCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Generate code sequence
    const codeLength = 16;
    const code = generatePRNSequence(codeLength);
    
    // Draw BOC modulated signal
    const samplesPerChip = 50;
    const totalSamples = codeLength * samplesPerChip;
    
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    for (let i = 0; i < totalSamples; i++) {
        const chipIndex = Math.floor(i / samplesPerChip);
        const t = i / (chipRate * 1e6 * samplesPerChip / codeLength);
        const x = (i / totalSamples) * width;
        
        // Code value
        const codeValue = code[chipIndex];
        
        // Subcarrier value
        let subcarrier;
        if (phase === 'sine') {
            subcarrier = Math.sign(Math.sin(2 * Math.PI * subcarrierFreq * 1e6 * t));
        } else {
            subcarrier = Math.sign(Math.cos(2 * Math.PI * subcarrierFreq * 1e6 * t));
        }
        
        // BOC signal is product of code and subcarrier
        const bocSignal = codeValue * subcarrier;
        const y = height / 2 - bocSignal * height / 4;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Draw code overlay
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < codeLength; i++) {
        const x1 = (i / codeLength) * width;
        const x2 = ((i + 1) / codeLength) * width;
        const y = height / 2 - code[i] * height / 6;
        
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
    }
    
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('BOC Signal', 10, 20);
    ctx.fillText('Code', 10, 35);
}

function drawBOCSpectrum(subcarrierFreq, chipRate, bocType) {
    const canvas = document.getElementById('bocSpectrumCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw spectrum
    const freqPoints = 1000;
    const maxFreq = chipRate * 5; // MHz
    
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < freqPoints; i++) {
        const freq = (i / freqPoints - 0.5) * 2 * maxFreq;
        const x = (i / freqPoints) * width;
        
        // BOC spectrum has nulls at multiples of subcarrier frequency
        let psd = 0;
        const normalizedFreq = freq / chipRate;
        
        if (Math.abs(normalizedFreq) < 0.001) {
            psd = 0; // Null at DC
        } else {
            const sinc = Math.sin(Math.PI * normalizedFreq) / (Math.PI * normalizedFreq);
            
            // Different spectral characteristics for different BOC types
            let spectralShape = 1;
            
            if (bocType === 'mboc') {
                // MBOC has combination of BOC(1,1) and BOC(6,1) spectra
                const cosine1 = Math.cos(Math.PI * freq / 1.023);
                const cosine6 = Math.cos(Math.PI * freq / 6.138);
                spectralShape = 0.75 * cosine1 + 0.25 * cosine6;
            } else if (bocType === 'altboc') {
                // AltBOC has different spectral characteristics
                spectralShape = Math.cos(Math.PI * freq / subcarrierFreq) * Math.cos(Math.PI * freq / (2 * subcarrierFreq));
            } else {
                // Standard BOC
                spectralShape = Math.cos(Math.PI * freq / subcarrierFreq);
            }
            
            psd = Math.pow(sinc * spectralShape, 2);
        }
        
        if (isNaN(psd) || !isFinite(psd)) psd = 0;
        psd = Math.max(0, psd);
        
        const y = height - (psd * height * 0.8);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Mark subcarrier frequencies
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    const subcarrierPos = (0.5 + subcarrierFreq / (2 * maxFreq)) * width;
    ctx.beginPath();
    ctx.moveTo(subcarrierPos, 0);
    ctx.lineTo(subcarrierPos, height);
    ctx.stroke();
    
    const subcarrierNeg = (0.5 - subcarrierFreq / (2 * maxFreq)) * width;
    ctx.beginPath();
    ctx.moveTo(subcarrierNeg, 0);
    ctx.lineTo(subcarrierNeg, height);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('BOC PSD', 10, 20);
    ctx.fillText('Frequency (MHz)', width - 80, height - 10);
}

function drawBOCCorrelation(subcarrierFreq, chipRate, bocType) {
    const canvas = document.getElementById('bocCorrelationCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Generate BOC autocorrelation function
    const numLags = 200;
    const maxLag = 2; // chips
    
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < numLags; i++) {
        const lag = (i / numLags - 0.5) * 2 * maxLag;
        const x = (i / numLags) * width;
        
        // BOC correlation has multiple peaks due to subcarrier
        let correlation = 0;
        if (Math.abs(lag) < 0.01) {
            correlation = 1; // Main peak
        } else {
            const sinc = Math.sin(Math.PI * lag) / (Math.PI * lag);
            
            // Different correlation patterns for different BOC types
            if (bocType === 'mboc') {
                // MBOC has complex correlation due to mixed subcarriers
                const corr1 = Math.cos(Math.PI * 1.023 * lag / chipRate);
                const corr6 = Math.cos(Math.PI * 6.138 * lag / chipRate);
                correlation = sinc * (0.75 * corr1 + 0.25 * corr6);
            } else if (bocType === 'altboc') {
                // AltBOC has different correlation structure
                const cosine = Math.cos(Math.PI * subcarrierFreq * lag / chipRate);
                correlation = sinc * cosine * Math.exp(-Math.abs(lag));
            } else {
                // Standard BOC correlation
                const cosine = Math.cos(Math.PI * subcarrierFreq * lag / chipRate);
                correlation = sinc * cosine;
            }
            
            // Add side peaks for higher frequency BOCs
            if (subcarrierFreq > 2) {
                const sidePeakPos = chipRate / subcarrierFreq;
                if (Math.abs(Math.abs(lag) - sidePeakPos) < 0.1) {
                    correlation += 0.3 * sinc;
                }
            }
        }
        
        if (isNaN(correlation)) correlation = 0;
        
        const y = height / 2 - correlation * height / 3;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Draw zero lag line
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('BOC Autocorrelation', 10, 20);
    ctx.fillText('Lag (chips)', width - 80, height - 10);
}

// Combined Signal Functions
function updateCombinedSignal() {
    try {
        const signalType = document.getElementById('signalType').value;
        const showComponents = document.getElementById('showComponents').value;
        
        drawSignalComponents(signalType, showComponents);
        drawFinalSignal(signalType);
        drawReceivedSignal(signalType);
        drawCorrelationProcess(signalType);
    } catch (error) {
        console.error('Error in updateCombinedSignal:', error);
    }
}

function drawSignalComponents(signalType, showComponents) {
    const canvas = document.getElementById('componentsCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Add test marker
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(10, 10, 20, 20);
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.fillText(`Signal: ${signalType}`, 40, 25);
    
    const numSamples = 500;
    const lineHeight = height / 4;
    
    // Navigation data (50 bps)
    if (showComponents === 'all' || showComponents === 'data_only') {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const dataRate = 50; // bps
        const bitsInView = 4;
        const data = [1, -1, 1, -1]; // Sample data bits
        
        for (let i = 0; i < numSamples; i++) {
            const bitIndex = Math.floor((i / numSamples) * bitsInView);
            const x = (i / numSamples) * width;
            const y = lineHeight - data[bitIndex] * lineHeight / 3;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        ctx.fillStyle = '#dc2626';
        ctx.font = '12px Arial';
        ctx.fillText('Navigation Data (50 bps)', 10, lineHeight - lineHeight/2 + 5);
    }
    
    // Ranging code
    if (showComponents === 'all' || showComponents === 'code_only') {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        const codeLength = 32;
        const code = generatePRNSequence(codeLength);
        
        for (let i = 0; i < numSamples; i++) {
            const chipIndex = Math.floor((i / numSamples) * codeLength);
            const x = (i / numSamples) * width;
            const y = lineHeight * 2 - code[chipIndex] * lineHeight / 3;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        ctx.fillStyle = '#2563eb';
        ctx.font = '12px Arial';
        ctx.fillText('Ranging Code (1.023 Mcps)', 10, lineHeight * 2 - lineHeight/2 + 5);
    }
    
    // Carrier
    if (showComponents === 'all' || showComponents === 'carrier_only') {
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const carrierFreq = 1575.42; // MHz (simplified for visualization)
        
        for (let i = 0; i < numSamples; i++) {
            const t = i / numSamples;
            const x = (i / numSamples) * width;
            const carrier = Math.cos(2 * Math.PI * 10 * t); // Scaled frequency for visualization
            const y = lineHeight * 3 - carrier * lineHeight / 4;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        ctx.fillStyle = '#059669';
        ctx.font = '12px Arial';
        ctx.fillText('L1 Carrier (1575.42 MHz)', 10, lineHeight * 3 - lineHeight/2 + 5);
    }
}

function drawFinalSignal(signalType) {
    const canvas = document.getElementById('finalSignalCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const numSamples = 1000;
    
    // Generate combined signal
    const data = [1, -1, 1, -1, 1]; // Navigation data
    const codeLength = 50;
    const code = generatePRNSequence(codeLength);
    
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const x = (i / numSamples) * width;
        
        // Get data bit (much slower than code)
        const dataIndex = Math.floor(t * data.length);
        const dataBit = data[dataIndex];
        
        // Get code chip
        const chipIndex = Math.floor(t * codeLength);
        const codeChip = code[chipIndex];
        
        // Carrier
        const carrier = Math.cos(2 * Math.PI * 15 * t); // Scaled for visualization
        
        // Combined signal: Data ⊕ Code × Carrier
        const signal = dataBit * codeChip * carrier;
        const y = height / 2 - signal * height / 3;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Transmitted GNSS Signal', 10, 20);
    ctx.fillText('s(t) = √P × D(t) × C(t) × cos(2πf₀t + φ)', 10, height - 10);
}

function drawReceivedSignal(signalType) {
    const canvas = document.getElementById('receivedSignalCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const numSamples = 1000;
    
    // Generate received signal with noise and attenuation
    const data = [1, -1, 1, -1, 1];
    const codeLength = 50;
    const code = generatePRNSequence(codeLength);
    const attenuation = 0.1; // -20 dB typical for GPS
    const noiseLevel = 0.2;
    
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const x = (i / numSamples) * width;
        
        // Signal components
        const dataIndex = Math.floor(t * data.length);
        const dataBit = data[dataIndex];
        const chipIndex = Math.floor(t * codeLength);
        const codeChip = code[chipIndex];
        const carrier = Math.cos(2 * Math.PI * 15 * t);
        
        // Attenuated signal + noise
        const signal = attenuation * dataBit * codeChip * carrier;
        const noise = (Math.random() - 0.5) * noiseLevel;
        const receivedSignal = signal + noise;
        
        const y = height / 2 - receivedSignal * height / 2;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Received Signal (with noise)', 10, 20);
    ctx.fillText('Signal buried in noise (-130 dBm typical)', 10, 35);
}

function drawCorrelationProcess(signalType) {
    const canvas = document.getElementById('correlationProcessCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Simulate correlation function
    const numLags = 100;
    const codeLength = 50;
    const code = generatePRNSequence(codeLength);
    
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let maxCorr = 0;
    let peakLag = 0;
    
    for (let i = 0; i < numLags; i++) {
        const lag = (i / numLags - 0.5) * 2; // -1 to 1 code periods
        const x = (i / numLags) * width;
        
        // Calculate correlation at this lag
        let correlation = 0;
        if (Math.abs(lag) < 0.1) {
            correlation = 1 - Math.abs(lag) * 10; // Main peak
        } else {
            correlation = Math.random() * 0.1 - 0.05; // Noise floor
        }
        
        if (correlation > maxCorr) {
            maxCorr = correlation;
            peakLag = i;
        }
        
        const y = height - (correlation + 0.1) * height / 1.2;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Mark peak
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    const peakX = (peakLag / numLags) * width;
    const peakY = height - (maxCorr + 0.1) * height / 1.2;
    ctx.arc(peakX, peakY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw threshold line
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    const thresholdY = height - (0.5 + 0.1) * height / 1.2;
    ctx.beginPath();
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(width, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Correlation Function', 10, 20);
    ctx.fillText('Acquisition Threshold', 10, thresholdY - 5);
    ctx.fillText('Peak = Signal Detected', peakX + 10, peakY - 10);
}

function animateSignalPropagation() {
    // Stop any existing animation
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    const signalType = document.getElementById('signalType').value;
    let animationStep = 0;
    const totalSteps = 3000; // Total animation frames
    let isAnimating = true;
    
    // Update button text to show animation is running
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = "Stop Animation";
    button.onclick = () => {
        isAnimating = false;
        cancelAnimationFrame(animationId);
        button.textContent = originalText;
        button.onclick = animateSignalPropagation;
        // Restore static displays
        updateCombinedSignal();
    };
    
    function animate() {
        if (!isAnimating) return;
        
        const progress = animationStep / totalSteps;
        
        // Draw different phases of signal propagation
        drawAnimatedSignalComponents(signalType, progress, animationStep);
        drawAnimatedTransmission(signalType, progress, animationStep);
        drawAnimatedReception(signalType, progress, animationStep);
        drawAnimatedCorrelation(signalType, progress, animationStep);
        
        animationStep++;
        
        if (animationStep >= totalSteps) {
            // Animation complete - reset
            animationStep = 0;
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// Animated drawing functions for signal propagation
function drawAnimatedSignalComponents(signalType, progress, step) {
    const canvas = document.getElementById('componentsCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const lineHeight = height / 4;
    const numSamples = 200;
    
    // Animation phases: 0-0.33 build data, 0.33-0.66 build code, 0.66-1.0 build carrier
    
    // Navigation data (builds up first)
    if (progress > 0) {
        const dataProgress = Math.min(progress * 3, 1);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const data = [1, -1, 1, -1, 1, -1, 1, 1]; // Sample data bits
        const visibleSamples = Math.floor(numSamples * dataProgress);
        
        for (let i = 0; i < visibleSamples; i++) {
            const bitIndex = Math.floor((i / numSamples) * data.length);
            const x = (i / numSamples) * width;
            const y = lineHeight - data[bitIndex] * lineHeight / 3;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        ctx.fillStyle = '#dc2626';
        ctx.font = '12px Arial';
        ctx.fillText(`Navigation Data (50 bps) - ${(dataProgress * 100).toFixed(0)}%`, 10, lineHeight - lineHeight/2 + 5);
    }
    
    // Ranging code (builds up second)
    if (progress > 0.33) {
        const codeProgress = Math.min((progress - 0.33) * 3, 1);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        const codeLength = 32;
        const code = generatePRNSequence(codeLength);
        const visibleSamples = Math.floor(numSamples * codeProgress);
        
        for (let i = 0; i < visibleSamples; i++) {
            const chipIndex = Math.floor((i / numSamples) * codeLength);
            const x = (i / numSamples) * width;
            const y = lineHeight * 2 - code[chipIndex] * lineHeight / 3;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        ctx.fillStyle = '#2563eb';
        ctx.font = '12px Arial';
        ctx.fillText(`Ranging Code (1.023 Mcps) - ${(codeProgress * 100).toFixed(0)}%`, 10, lineHeight * 2 - lineHeight/2 + 5);
    }
    
    // Carrier (builds up last)
    if (progress > 0.66) {
        const carrierProgress = Math.min((progress - 0.66) * 3, 1);
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const visibleSamples = Math.floor(numSamples * carrierProgress);
        
        for (let i = 0; i < visibleSamples; i++) {
            const t = i / numSamples;
            const x = (i / numSamples) * width;
            const carrier = Math.cos(2 * Math.PI * 15 * t + step * 0.1); // Animated phase
            const y = lineHeight * 3 - carrier * lineHeight / 4;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        ctx.fillStyle = '#059669';
        ctx.font = '12px Arial';
        ctx.fillText(`L1 Carrier (1575.42 MHz) - ${(carrierProgress * 100).toFixed(0)}%`, 10, lineHeight * 3 - lineHeight/2 + 5);
    }
}

function drawAnimatedTransmission(signalType, progress, step) {
    const canvas = document.getElementById('finalSignalCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Show signal traveling from left to right
    const numSamples = 500;
    const data = [1, -1, 1, -1, 1]; // Navigation data
    const codeLength = 50;
    const code = generatePRNSequence(codeLength);
    
    // Create a "traveling wave" effect
    const wavePosition = progress * width;
    const waveWidth = width * 0.3;
    
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < numSamples; i++) {
        const x = (i / numSamples) * width;
        const t = i / numSamples;
        
        // Only draw the signal where the wave has passed
        if (x <= wavePosition) {
            const dataIndex = Math.floor(t * data.length);
            const dataBit = data[dataIndex];
            const chipIndex = Math.floor(t * codeLength);
            const codeChip = code[chipIndex];
            const carrier = Math.cos(2 * Math.PI * 20 * t + step * 0.2);
            
            // Combined signal with amplitude that fades with distance
            const distanceFromWave = Math.abs(x - wavePosition);
            const amplitude = Math.exp(-distanceFromWave / waveWidth) * 0.5 + 0.5;
            const signal = dataBit * codeChip * carrier * amplitude;
            const y = height / 2 - signal * height / 3;
            
            if (i === 0 || x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
    }
    
    ctx.stroke();
    
    // Draw traveling wave indicator
    ctx.fillStyle = 'rgba(124, 58, 237, 0.3)';
    ctx.fillRect(Math.max(0, wavePosition - waveWidth), 0, waveWidth, height);
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Signal Transmission from Satellite', 10, 20);
    ctx.fillText(`Progress: ${(progress * 100).toFixed(0)}%`, 10, 35);
    ctx.fillText('s(t) = √P × D(t) × C(t) × cos(2πf₀t + φ)', 10, height - 10);
}

function drawAnimatedReception(signalType, progress, step) {
    const canvas = document.getElementById('receivedSignalCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Show signal arriving with increasing noise and fading
    const numSamples = 500;
    const data = [1, -1, 1, -1, 1];
    const codeLength = 50;
    const code = generatePRNSequence(codeLength);
    
    // Signal strength decreases over time (path loss)
    const signalStrength = 0.8 - progress * 0.6; // Starts strong, gets weak
    const noiseLevel = 0.1 + progress * 0.3; // Noise increases
    
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const x = (i / numSamples) * width;
        
        // Signal components
        const dataIndex = Math.floor(t * data.length);
        const dataBit = data[dataIndex];
        const chipIndex = Math.floor(t * codeLength);
        const codeChip = code[chipIndex];
        const carrier = Math.cos(2 * Math.PI * 20 * t + step * 0.15);
        
        // Attenuated signal + increasing noise
        const signal = signalStrength * dataBit * codeChip * carrier;
        const noise = (Math.random() - 0.5) * noiseLevel * Math.sin(step * 0.3 + i * 0.1);
        const receivedSignal = signal + noise;
        
        const y = height / 2 - receivedSignal * height / 2;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Show signal strength indicator
    ctx.fillStyle = `rgba(245, 158, 11, ${signalStrength})`;
    ctx.fillRect(10, 10, 100 * signalStrength, 20);
    ctx.strokeStyle = '#333333';
    ctx.strokeRect(10, 10, 100, 20);
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Signal Reception at Receiver', 10, 45);
    ctx.fillText(`Signal Strength: ${(signalStrength * 100).toFixed(0)}%`, 120, 25);
    ctx.fillText(`Path Loss: ${(20 * Math.log10(1/signalStrength)).toFixed(1)} dB`, 10, height - 10);
}

function drawAnimatedCorrelation(signalType, progress, step) {
    const canvas = document.getElementById('correlationProcessCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Animate correlation process - scanning for peak
    const numLags = 100;
    const scanPosition = progress * numLags;
    
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let maxCorr = 0;
    let peakFound = false;
    
    for (let i = 0; i < numLags; i++) {
        const lag = (i / numLags - 0.5) * 2; // -1 to 1 code periods
        const x = (i / numLags) * width;
        
        // Calculate correlation at this lag
        let correlation = 0;
        if (Math.abs(lag) < 0.1) {
            correlation = 1 - Math.abs(lag) * 10; // Main peak
            if (i <= scanPosition) {
                maxCorr = Math.max(maxCorr, correlation);
                if (correlation > 0.8) peakFound = true;
            }
        } else {
            correlation = (Math.random() - 0.5) * 0.1; // Noise floor
        }
        
        // Only draw correlation values up to scan position
        if (i <= scanPosition) {
            const y = height - (correlation + 0.1) * height / 1.2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
    }
    
    ctx.stroke();
    
    // Draw scanning line
    const scanX = (scanPosition / numLags) * width;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scanX, 0);
    ctx.lineTo(scanX, height);
    ctx.stroke();
    
    // Draw threshold line
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    const thresholdY = height - (0.5 + 0.1) * height / 1.2;
    ctx.beginPath();
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(width, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Correlation Process - Code Acquisition', 10, 20);
    ctx.fillText(`Scanning: ${(progress * 100).toFixed(0)}%`, 10, 35);
    ctx.fillText('Acquisition Threshold', 10, thresholdY - 5);
    
    if (peakFound) {
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('SIGNAL ACQUIRED!', width - 150, 30);
    } else {
        ctx.fillStyle = '#dc2626';
        ctx.fillText('Searching...', width - 100, 30);
    }
}

// Update value displays for range inputs
document.addEventListener('input', function(e) {
    if (e.target.type === 'range') {
        const value = parseFloat(e.target.value);
        const displayId = e.target.id + 'Value';
        const displayElement = document.getElementById(displayId);
        
        if (displayElement) {
            switch(e.target.id) {
                case 'chipRate':
                    displayElement.textContent = value + ' Mcps';
                    break;
                case 'carrierFreq':
                    displayElement.textContent = value + ' MHz';
                    break;
                case 'dataRate':
                    displayElement.textContent = value + ' bps';
                    break;
                case 'snr':
                    displayElement.textContent = value + ' dB';
                    break;
                case 'subcarrierFreq':
                    displayElement.textContent = value + ' MHz';
                    break;
                case 'bocChipRate':
                    displayElement.textContent = value + ' Mcps';
                    break;
            }
        }
    }
});

// Utility function to handle canvas resizing
window.addEventListener('resize', function() {
    setTimeout(() => {
        initializeCanvases();
        updateRangingCode();
        updateCarrierModulation();
        updateBOCModulation();
        updateCombinedSignal();
        updateL1Multiplexing();
        updatePlayground();
    }, 100);
});

// GPS L1 Multiplexing Functions
function updateL1Multiplexing() {
    const service = document.getElementById('l1Service').value;
    const viewType = document.getElementById('l1ViewType').value;
    const freqOffset = parseFloat(document.getElementById('l1FreqOffset').value);
    const showDetails = document.getElementById('l1ShowDetails').checked;
    
    // Update frequency offset display
    document.getElementById('l1FreqOffsetValue').textContent = `${freqOffset.toFixed(1)} MHz`;
    
    // Draw based on view type
    switch(viewType) {
        case 'spectrum':
            drawL1Spectrum(service, freqOffset, showDetails);
            break;
        case 'constellation':
            drawL1Constellation(service, showDetails);
            break;
        case 'structure':
            drawL1Structure(service, showDetails);
            break;
        case 'orthogonal':
            drawL1OrthogonalComponents(service, showDetails);
            break;
    }
}

function drawL1Spectrum(service, freqOffset, showDetails) {
    const canvas = document.getElementById('l1SpectrumCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Frequency range: -20 to +20 MHz around L1 center frequency
    const centerFreq = 1575.42; // MHz
    const freqRange = 40; // MHz total range
    const startFreq = -freqRange/2 + freqOffset;
    const endFreq = freqRange/2 + freqOffset;
    
    // Generate spectrum data for different services
    const numPoints = 1000;
    const freqStep = freqRange / numPoints;
    
    // Colors for different services
    const colors = {
        ca: '#dc2626',      // Red for C/A
        py: '#2563eb',      // Blue for P(Y)
        m: '#059669',       // Green for M code
        l1c: '#7c3aed',     // Purple for L1C
        all: '#333333'      // Black for combined
    };
    
    if (service === 'all' || service === 'ca') {
        drawServiceSpectrum(ctx, width, height, startFreq, freqStep, numPoints, 'ca', colors.ca, showDetails);
    }
    
    if (service === 'all' || service === 'py') {
        drawServiceSpectrum(ctx, width, height, startFreq, freqStep, numPoints, 'py', colors.py, showDetails);
    }
    
    if (service === 'all' || service === 'm') {
        drawServiceSpectrum(ctx, width, height, startFreq, freqStep, numPoints, 'm', colors.m, showDetails);
    }
    
    if (service === 'all' || service === 'l1c') {
        drawServiceSpectrum(ctx, width, height, startFreq, freqStep, numPoints, 'l1c', colors.l1c, showDetails);
    }
    
    // Draw frequency axis
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 30);
    ctx.lineTo(width, height - 30);
    ctx.stroke();
    
    // Draw frequency labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= 4; i++) {
        const x = (i / 4) * width;
        const freq = startFreq + (i / 4) * freqRange;
        const actualFreq = centerFreq + freq;
        ctx.fillText(`${actualFreq.toFixed(1)}`, x, height - 15);
    }
    
    // Draw title and legend
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('GPS L1 Power Spectral Density', 10, 25);
    
    if (showDetails) {
        drawL1Legend(ctx, width, height, service, colors);
    }
}

function drawServiceSpectrum(ctx, width, height, startFreq, freqStep, numPoints, serviceType, color, showDetails) {
    ctx.strokeStyle = color;
    ctx.lineWidth = serviceType === 'ca' ? 3 : 2;
    ctx.beginPath();
    
    let maxPower = -60; // dBm
    
    for (let i = 0; i < numPoints; i++) {
        const freq = startFreq + i * freqStep;
        let power = calculateServicePSD(freq, serviceType);
        
        const x = (i / numPoints) * width;
        const y = height - 30 - ((power + 100) / 40) * (height - 60);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        if (power > maxPower) maxPower = power;
    }
    
    ctx.stroke();
    
    // Add service label
    if (showDetails) {
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        const serviceNames = {
            ca: 'L1 C/A (1.023 MHz)',
            py: 'P(Y) Code (10.23 MHz)', 
            m: 'M Code (5.115 MHz)',
            l1c: 'L1C (25.6 MHz)'
        };
        
        const labelY = 45 + Object.keys(serviceNames).indexOf(serviceType) * 15;
        ctx.fillText(`${serviceNames[serviceType]}: ${maxPower.toFixed(1)} dBm`, 10, labelY);
    }
}

function calculateServicePSD(freq, serviceType) {
    // Simplified PSD calculation for different GPS L1 services
    switch(serviceType) {
        case 'ca':
            // C/A code: sinc^2 function with 1.023 MHz nulls
            const caWidth = 1.023;
            const caArg = Math.PI * freq / caWidth;
            return -70 + 20 * Math.log10(Math.abs(Math.sin(caArg) / caArg)) - Math.abs(freq) * 0.5;
            
        case 'py':
            // P(Y) code: wider spectrum with 10.23 MHz characteristics
            const pyWidth = 10.23;
            const pyArg = Math.PI * freq / pyWidth;
            return -65 + 20 * Math.log10(Math.abs(Math.sin(pyArg) / pyArg)) - Math.abs(freq) * 0.2;
            
        case 'm':
            // M code: split spectrum design
            const mWidth = 5.115;
            const mArg = Math.PI * freq / mWidth;
            const splitLobe = Math.cos(Math.PI * freq / 24);
            return -68 + 20 * Math.log10(Math.abs(Math.sin(mArg) / mArg * splitLobe)) - Math.abs(freq) * 0.3;
            
        case 'l1c':
            // L1C: pilot and data channels
            const l1cWidth = 25.6;
            const l1cArg = Math.PI * freq / l1cWidth;
            return -63 + 20 * Math.log10(Math.abs(Math.sin(l1cArg) / l1cArg)) - Math.abs(freq) * 0.1;
            
        default:
            return -100;
    }
}

function drawL1Constellation(service, showDetails) {
    const canvas = document.getElementById('l1ConstellationCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    // Draw constellation based on service
    switch(service) {
        case 'ca':
            drawBPSKConstellation(ctx, centerX, centerY, radius, '#dc2626', 'C/A Code BPSK');
            break;
        case 'py':
            drawBPSKConstellation(ctx, centerX, centerY, radius, '#2563eb', 'P(Y) Code BPSK');
            break;
        case 'm':
            drawMCodeConstellation(ctx, centerX, centerY, radius, '#059669', showDetails);
            break;
        case 'l1c':
            drawL1CConstellation(ctx, centerX, centerY, radius, '#7c3aed', showDetails);
            break;
        case 'all':
            drawCombinedConstellation(ctx, centerX, centerY, radius, showDetails);
            break;
    }
    
    // Draw I/Q axes
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // I axis (horizontal)
    ctx.beginPath();
    ctx.moveTo(50, centerY);
    ctx.lineTo(width - 50, centerY);
    ctx.stroke();
    
    // Q axis (vertical)
    ctx.beginPath();
    ctx.moveTo(centerX, 50);
    ctx.lineTo(centerX, height - 50);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('I (In-phase)', centerX, height - 20);
    ctx.save();
    ctx.translate(20, centerY);
    ctx.rotate(-Math.PI/2);
    ctx.fillText('Q (Quadrature)', 0, 0);
    ctx.restore();
}

function drawBPSKConstellation(ctx, centerX, centerY, radius, color, label) {
    ctx.fillStyle = color;
    
    // BPSK has two points on the I axis
    const pointRadius = 8;
    
    // +1 symbol
    ctx.beginPath();
    ctx.arc(centerX + radius * 0.7, centerY, pointRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // -1 symbol  
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.7, centerY, pointRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Label
    ctx.font = 'bold 14px Arial';
    ctx.fillText(label, centerX, 30);
    
    // Point labels
    ctx.font = '12px Arial';
    ctx.fillText('+1', centerX + radius * 0.7, centerY - 15);
    ctx.fillText('-1', centerX - radius * 0.7, centerY - 15);
}

function drawMCodeConstellation(ctx, centerX, centerY, radius, color, showDetails) {
    ctx.fillStyle = color;
    const pointRadius = 6;
    
    // M-code uses time-multiplexed BOC structure
    // Show multiple constellation points representing the BOC modulation
    const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
    const distances = [0.5, 0.8];
    
    angles.forEach((angle, i) => {
        distances.forEach((dist, j) => {
            const x = centerX + radius * dist * Math.cos(angle);
            const y = centerY + radius * dist * Math.sin(angle);
            
            ctx.beginPath();
            ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            if (showDetails) {
                ctx.font = '10px Arial';
                ctx.fillText(`${i}${j}`, x + 10, y);
            }
        });
    });
    
    ctx.font = 'bold 14px Arial';
    ctx.fillText('M-Code BOC Constellation', centerX, 30);
}

function drawL1CConstellation(ctx, centerX, centerY, radius, color, showDetails) {
    ctx.fillStyle = color;
    const pointRadius = 6;
    
    // L1C uses QPSK for data and pilot channels
    const qpskPoints = [
        {x: 1, y: 1, label: '00'},
        {x: -1, y: 1, label: '01'}, 
        {x: -1, y: -1, label: '11'},
        {x: 1, y: -1, label: '10'}
    ];
    
    qpskPoints.forEach(point => {
        const x = centerX + radius * 0.6 * point.x;
        const y = centerY + radius * 0.6 * point.y;
        
        ctx.beginPath();
        ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        if (showDetails) {
            ctx.font = '12px Arial';
            ctx.fillText(point.label, x + 12, y + 4);
        }
    });
    
    ctx.font = 'bold 14px Arial';
    ctx.fillText('L1C QPSK Constellation', centerX, 30);
}

function drawCombinedConstellation(ctx, centerX, centerY, radius, showDetails) {
    // Draw all service constellations with transparency
    ctx.globalAlpha = 0.6;
    
    // Offset each service slightly for visibility
    drawBPSKConstellation(ctx, centerX - 50, centerY - 30, radius * 0.6, '#dc2626', '');
    drawBPSKConstellation(ctx, centerX + 50, centerY - 30, radius * 0.6, '#2563eb', '');
    drawL1CConstellation(ctx, centerX, centerY + 40, radius * 0.6, '#7c3aed', false);
    
    ctx.globalAlpha = 1.0;
    
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Combined L1 Signal Constellations', centerX, 25);
    
    if (showDetails) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#dc2626';
        ctx.fillText('C/A', centerX - 50, centerY - 60);
        ctx.fillStyle = '#2563eb';
        ctx.fillText('P(Y)', centerX + 50, centerY - 60);
        ctx.fillStyle = '#7c3aed';
        ctx.fillText('L1C', centerX, centerY + 10);
    }
}

function drawL1Structure(service, showDetails) {
    const canvas = document.getElementById('l1StructureCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw signal structure diagram
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText('GPS L1 Signal Structure', width/2, 25);
    
    const blockHeight = 40;
    const blockWidth = 150;
    const startY = 50;
    const spacing = 180;
    
    // Draw signal components based on service
    switch(service) {
        case 'ca':
            drawSignalBlock(ctx, width/2 - blockWidth/2, startY, blockWidth, blockHeight, 'Navigation Data\n50 bps', '#dc2626');
            drawSignalBlock(ctx, width/2 - blockWidth/2, startY + 60, blockWidth, blockHeight, 'C/A Code\n1.023 Mcps', '#dc2626');
            drawSignalBlock(ctx, width/2 - blockWidth/2, startY + 120, blockWidth, blockHeight, 'L1 Carrier\n1575.42 MHz', '#dc2626');
            break;
            
        case 'py':
            drawSignalBlock(ctx, width/2 - blockWidth/2, startY, blockWidth, blockHeight, 'Navigation Data\n50 bps', '#2563eb');
            drawSignalBlock(ctx, width/2 - blockWidth/2, startY + 60, blockWidth, blockHeight, 'P(Y) Code\n10.23 Mcps', '#2563eb');
            drawSignalBlock(ctx, width/2 - blockWidth/2, startY + 120, blockWidth, blockHeight, 'L1 Carrier\n1575.42 MHz', '#2563eb');
            break;
            
        case 'l1c':
            drawSignalBlock(ctx, width/4, startY, blockWidth, blockHeight, 'L1C Data\n100 sps', '#7c3aed');
            drawSignalBlock(ctx, 3*width/4 - blockWidth, startY, blockWidth, blockHeight, 'L1C Pilot\nNo Data', '#7c3aed');
            drawSignalBlock(ctx, width/2 - blockWidth/2, startY + 60, blockWidth, blockHeight, 'L1C Code\n1.023 Mcps', '#7c3aed');
            drawSignalBlock(ctx, width/2 - blockWidth/2, startY + 120, blockWidth, blockHeight, 'L1 Carrier\n1575.42 MHz', '#7c3aed');
            break;
            
        case 'all':
            drawMultiplexedStructure(ctx, width, height, showDetails);
            return;
    }
    
    // Draw signal flow arrows
    drawArrows(ctx, width/2, startY + blockHeight, startY + 120);
    
    if (showDetails) {
        drawDetailedSpecs(ctx, width, height, service);
    }
}

function drawSignalBlock(ctx, x, y, width, height, text, color) {
    // Draw block
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1.0;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Draw text
    ctx.fillStyle = color;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const lines = text.split('\n');
    lines.forEach((line, i) => {
        ctx.fillText(line, x + width/2, y + height/2 + (i - 0.5) * 15);
    });
}

function drawArrows(ctx, centerX, startY, endY) {
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    
    for (let y = startY + 10; y < endY; y += 60) {
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(centerX, y + 40);
        
        // Arrow head
        ctx.moveTo(centerX - 5, y + 35);
        ctx.lineTo(centerX, y + 40);
        ctx.lineTo(centerX + 5, y + 35);
        ctx.stroke();
    }
}

function drawMultiplexedStructure(ctx, width, height, showDetails) {
    // Clear and redraw with multiplexed view
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText('GPS L1 Multiplexed Signal Architecture', width/2, 25);
    
    // Draw orthogonal signal separation
    const services = [
        {name: 'L1 C/A', color: '#dc2626', x: width * 0.15, y: 60},
        {name: 'P(Y)', color: '#2563eb', x: width * 0.4, y: 60},
        {name: 'M Code', color: '#059669', x: width * 0.65, y: 60},
        {name: 'L1C', color: '#7c3aed', x: width * 0.85, y: 60}
    ];
    
    services.forEach(service => {
        drawSignalBlock(ctx, service.x - 50, service.y, 100, 30, service.name, service.color);
    });
    
    // Draw combiner
    ctx.fillStyle = '#333333';
    ctx.fillRect(width/2 - 100, 140, 200, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Quadrature Combiner', width/2, 165);
    
    // Draw arrows to combiner
    services.forEach(service => {
        ctx.strokeStyle = service.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(service.x, service.y + 30);
        ctx.lineTo(width/2, 140);
        ctx.stroke();
    });
    
    // Output signal
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width/2, 180);
    ctx.lineTo(width/2, 220);
    ctx.stroke();
    
    ctx.fillStyle = '#333333';
    ctx.fillText('L1 Composite Signal', width/2, 240);
    ctx.font = '12px Arial';
    ctx.fillText('1575.42 MHz ± 24 MHz', width/2, 255);
}

function drawL1OrthogonalComponents(service, showDetails) {
    const canvas = document.getElementById('l1StructureCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText('GPS L1 Orthogonal Signal Components', width/2, 25);
    
    // Draw I and Q channels
    const channelWidth = width * 0.4;
    const channelHeight = height * 0.3;
    const iX = width * 0.1;
    const qX = width * 0.55;
    const channelY = height * 0.2;
    
    // I Channel
    ctx.fillStyle = 'rgba(220, 38, 38, 0.1)';
    ctx.fillRect(iX, channelY, channelWidth, channelHeight);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.strokeRect(iX, channelY, channelWidth, channelHeight);
    
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('I Channel (In-phase)', iX + channelWidth/2, channelY - 10);
    
    // Q Channel  
    ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
    ctx.fillRect(qX, channelY, channelWidth, channelHeight);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(qX, channelY, channelWidth, channelHeight);
    
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Q Channel (Quadrature)', qX + channelWidth/2, channelY - 10);
    
    // Add service-specific content
    ctx.font = '12px Arial';
    switch(service) {
        case 'ca':
            ctx.fillStyle = '#dc2626';
            ctx.fillText('C/A Code + Nav Data', iX + channelWidth/2, channelY + 30);
            ctx.fillStyle = '#666666';
            ctx.fillText('(Empty)', qX + channelWidth/2, channelY + 30);
            break;
        case 'py':
            ctx.fillStyle = '#dc2626';
            ctx.fillText('P Code + Nav Data', iX + channelWidth/2, channelY + 30);
            ctx.fillStyle = '#2563eb';
            ctx.fillText('Y Code (Encrypted)', qX + channelWidth/2, channelY + 30);
            break;
        case 'l1c':
            ctx.fillStyle = '#dc2626';
            ctx.fillText('L1C Data Channel', iX + channelWidth/2, channelY + 30);
            ctx.fillStyle = '#2563eb';
            ctx.fillText('L1C Pilot Channel', qX + channelWidth/2, channelY + 30);
            break;
        case 'all':
            ctx.fillStyle = '#dc2626';
            ctx.fillText('C/A + P + L1C Data', iX + channelWidth/2, channelY + 30);
            ctx.fillStyle = '#2563eb';  
            ctx.fillText('Y + M + L1C Pilot', qX + channelWidth/2, channelY + 30);
            break;
    }
    
    if (showDetails) {
        // Show signal equations
        ctx.fillStyle = '#333333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        const eqY = height * 0.7;
        ctx.fillText('Signal Equations:', 20, eqY);
        ctx.fillText('I(t) = ΣAᵢ × Dᵢ(t) × Cᵢ(t)', 20, eqY + 20);
        ctx.fillText('Q(t) = ΣAⱼ × Dⱼ(t) × Cⱼ(t)', 20, eqY + 40);
        ctx.fillText('s(t) = I(t)cos(ωt) + Q(t)sin(ωt)', 20, eqY + 60);
    }
}

function drawL1Legend(ctx, width, height, service, colors) {
    const legendX = width - 200;
    const legendY = 50;
    const lineHeight = 20;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(legendX - 10, legendY - 10, 190, 120);
    ctx.strokeStyle = '#333333';
    ctx.strokeRect(legendX - 10, legendY - 10, 190, 120);
    
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Legend:', legendX, legendY);
    
    const services = {
        ca: 'L1 C/A Code',
        py: 'P(Y) Code', 
        m: 'M Code',
        l1c: 'L1C Signal'
    };
    
    let index = 0;
    for (const [key, name] of Object.entries(services)) {
        if (service === 'all' || service === key) {
            ctx.strokeStyle = colors[key];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(legendX, legendY + 20 + index * lineHeight);
            ctx.lineTo(legendX + 20, legendY + 20 + index * lineHeight);
            ctx.stroke();
            
            ctx.fillStyle = colors[key];
            ctx.font = '11px Arial';
            ctx.fillText(name, legendX + 25, legendY + 24 + index * lineHeight);
            index++;
        }
    }
}

// Animation function for L1 signal acquisition
let l1AnimationId = null;

function animateL1Acquisition() {
    const button = event.target;
    const isRunning = l1AnimationId !== null;
    
    if (isRunning) {
        cancelAnimationFrame(l1AnimationId);
        l1AnimationId = null;
        button.textContent = '🎬 Animate Signal Acquisition';
        updateL1Multiplexing(); // Reset to static view
        return;
    }
    
    button.textContent = '⏹️ Stop Animation';
    
    let step = 0;
    const animate = () => {
        const progress = (step % 300) / 300; // 5-second loop
        
        animateL1AcquisitionStep(progress, step);
        
        step++;
        l1AnimationId = requestAnimationFrame(animate);
    };
    
    animate();
}

function animateL1AcquisitionStep(progress, step) {
    // Animate the acquisition process showing all L1 services
    const service = document.getElementById('l1Service').value;
    
    // Update spectrum with scanning effect
    animateL1Spectrum(progress, step);
    
    // Update constellation with signal lock
    animateL1Constellation(progress, step);
    
    // Show acquisition status
    animateL1Structure(progress, step);
}

function animateL1Spectrum(progress, step) {
    const canvas = document.getElementById('l1SpectrumCanvas');
    if (!canvas) return;
    
    // First draw the normal spectrum
    updateL1Multiplexing();
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Add scanning beam effect
    const scanPos = progress * width;
    const beamWidth = 50;
    
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.fillRect(scanPos - beamWidth/2, 0, beamWidth, height - 30);
    
    // Add acquisition status
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    
    const phase = Math.floor(progress * 4);
    const phases = ['Searching...', 'Signal Detected', 'Acquiring Lock', 'Tracking'];
    ctx.fillText(`Status: ${phases[phase]}`, 10, height - 45);
}

function animateL1Constellation(progress, step) {
    const canvas = document.getElementById('l1ConstellationCanvas');
    if (!canvas) return;
    
    // Draw base constellation
    const service = document.getElementById('l1Service').value;
    drawL1Constellation(service, true);
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Add noise and lock indication
    const noiseLevel = 1.0 - progress; // Noise decreases as we acquire
    const lockStrength = progress;
    
    // Draw noise cloud
    if (noiseLevel > 0) {
        ctx.fillStyle = `rgba(128, 128, 128, ${noiseLevel * 0.3})`;
        for (let i = 0; i < 50; i++) {
            const x = width/2 + (Math.random() - 0.5) * width * 0.5 * noiseLevel;
            const y = height/2 + (Math.random() - 0.5) * height * 0.5 * noiseLevel;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    
    // Draw lock indicator
    if (lockStrength > 0.7) {
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(width/2, height/2, 100 * lockStrength, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SIGNAL LOCKED', width/2, height - 20);
    }
}

function animateL1Structure(progress, step) {
    const canvas = document.getElementById('l1StructureCanvas');
    if (!canvas) return;
    
    // Draw base structure
    drawL1Structure('all', true);
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Add acquisition progress indicator
    const barWidth = width * 0.6;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    const barY = height - 40;
    
    // Progress bar background
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress bar fill
    ctx.fillStyle = '#059669';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // Progress bar border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Progress text
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Acquisition Progress: ${(progress * 100).toFixed(0)}%`, width/2, barY - 5);
}

// Modulation Playground Functions
let playgroundAnimationId = null;

function updatePlayground() {
    const mode = document.getElementById('playgroundMode').value;
    const dataPattern = document.getElementById('dataPattern').value;
    const codePattern = document.getElementById('codePattern').value;
    const carrierType = document.getElementById('carrierType').value;
    const carrierFreq = parseFloat(document.getElementById('carrierFreqPG').value);
    const dataRate = parseInt(document.getElementById('dataRatePG').value);
    const chipRate = parseInt(document.getElementById('chipRatePG').value);
    const noiseLevel = parseFloat(document.getElementById('noiseLevelPG').value);
    
    // Update display values
    document.getElementById('carrierFreqPGValue').textContent = `${carrierFreq.toFixed(1)} MHz`;
    document.getElementById('dataRatePGValue').textContent = `${dataRate} bps`;
    document.getElementById('chipRatePGValue').textContent = `${chipRate} cps`;
    document.getElementById('noiseLevelPGValue').textContent = `${(noiseLevel * 100).toFixed(0)}%`;
    
    // Show/hide custom data input
    const customDataGroup = document.getElementById('customDataGroup');
    if (dataPattern === 'custom') {
        customDataGroup.style.display = 'block';
    } else {
        customDataGroup.style.display = 'none';
    }
    
    // Generate signals based on current settings
    const signals = generatePlaygroundSignals(dataPattern, codePattern, carrierType, carrierFreq, dataRate, chipRate, noiseLevel);
    
    // Draw all canvases based on mode
    switch(mode) {
        case 'basic':
            drawBasicModulation(signals);
            break;
        case 'advanced':
            drawAdvancedGNSS(signals);
            break;
        case 'comparison':
            drawSideBySideComparison(signals);
            break;
        case 'interactive':
            drawInteractiveBuilder(signals);
            break;
    }
}

function generatePlaygroundSignals(dataPattern, codePattern, carrierType, carrierFreq, dataRate, chipRate, noiseLevel) {
    // Generate data bits
    let dataBits = generateDataPattern(dataPattern);
    
    // Generate spreading code
    let spreadingCode = generateSpreadingCode(codePattern, chipRate);
    
    // Create time arrays
    const samplesPerSecond = 1000;
    const duration = 2.0; // 2 seconds
    const numSamples = samplesPerSecond * duration;
    const timeArray = Array.from({length: numSamples}, (_, i) => i / samplesPerSecond);
    
    // Generate baseband signals
    const dataSignal = generateDataSignal(dataBits, dataRate, timeArray);
    const codeSignal = generateCodeSignal(spreadingCode, chipRate, timeArray);
    const combinedBaseband = multiplySignals(dataSignal, codeSignal);
    
    // Apply carrier modulation
    const modulatedSignal = applyCarrierModulation(combinedBaseband, carrierType, carrierFreq, timeArray);
    
    // Add noise
    const noisySignal = addNoise(modulatedSignal, noiseLevel);
    
    return {
        time: timeArray,
        dataBits: dataBits,
        dataSignal: dataSignal,
        spreadingCode: spreadingCode,
        codeSignal: codeSignal,
        combinedBaseband: combinedBaseband,
        modulatedSignal: modulatedSignal,
        noisySignal: noisySignal,
        parameters: {
            dataPattern, codePattern, carrierType, carrierFreq, dataRate, chipRate, noiseLevel
        }
    };
}

function generateDataPattern(pattern) {
    switch(pattern) {
        case 'binary':
            return [1, 0, 1, 1, 0, 1, 0, 0];
        case 'alternating':
            return [0, 1, 0, 1, 0, 1, 0, 1];
        case 'prbs':
            return generatePRBS7();
        case 'custom':
            const customData = document.getElementById('customData').value || '10110100';
            return customData.split('').map(bit => parseInt(bit)).filter(bit => bit === 0 || bit === 1);
        default:
            return [1, 0, 1, 1, 0, 1, 0, 0];
    }
}

function generatePRBS7() {
    // Generate PRBS-7 sequence (127 bits)
    let register = 0b1111111; // Initial state
    let sequence = [];
    
    for (let i = 0; i < 15; i++) { // Show first 15 bits
        const output = register & 1;
        sequence.push(output);
        
        const feedback = ((register >> 6) ^ (register >> 5)) & 1;
        register = ((register >> 1) | (feedback << 6)) & 0b1111111;
    }
    
    return sequence;
}

function generateSpreadingCode(pattern, chipRate) {
    switch(pattern) {
        case 'none':
            return [1]; // No spreading
        case 'walsh':
            return generateWalshCode(4); // 4-chip Walsh code
        case 'gold':
            return generateGoldSequence(15); // 15-chip Gold sequence
        case 'ca':
            return generateCACode(1, 31); // 31-chip simplified C/A
        case 'custom':
            return [1, -1, 1, 1, -1, 1, -1]; // Custom 7-chip code
        default:
            return [1];
    }
}

function generateWalshCode(length) {
    // Generate Walsh-Hadamard code
    const codes = {
        2: [1, 1],
        4: [1, 1, 1, 1],
        8: [1, 1, 1, 1, 1, 1, 1, 1]
    };
    return codes[length] || [1, 1, 1, 1];
}

function generateGoldSequence(length) {
    // Simplified Gold sequence generation
    const seq = [];
    for (let i = 0; i < length; i++) {
        seq.push(Math.random() > 0.5 ? 1 : -1);
    }
    return seq;
}

function generateDataSignal(dataBits, dataRate, timeArray) {
    const bitDuration = 1.0 / dataRate;
    return timeArray.map(t => {
        const bitIndex = Math.floor(t / bitDuration) % dataBits.length;
        return dataBits[bitIndex] === 1 ? 1 : -1;
    });
}

function generateCodeSignal(spreadingCode, chipRate, timeArray) {
    if (spreadingCode.length === 1 && spreadingCode[0] === 1) {
        return timeArray.map(() => 1); // No spreading
    }
    
    const chipDuration = 1.0 / chipRate;
    return timeArray.map(t => {
        const chipIndex = Math.floor(t / chipDuration) % spreadingCode.length;
        return spreadingCode[chipIndex];
    });
}

function multiplySignals(signal1, signal2) {
    return signal1.map((val, i) => val * signal2[i]);
}

function applyCarrierModulation(baseband, carrierType, carrierFreq, timeArray) {
    const fc = carrierFreq * 1e6; // Convert to Hz
    
    switch(carrierType) {
        case 'bpsk':
            return timeArray.map((t, i) => baseband[i] * Math.cos(2 * Math.PI * fc * t));
            
        case 'qpsk':
            // Split data into I and Q channels
            return timeArray.map((t, i) => {
                const I = baseband[i];
                const Q = baseband[Math.min(i + 1, baseband.length - 1)];
                return I * Math.cos(2 * Math.PI * fc * t) + Q * Math.sin(2 * Math.PI * fc * t);
            });
            
        case 'boc11':
            return timeArray.map((t, i) => {
                const subcarrier = Math.sign(Math.sin(2 * Math.PI * 1.023e6 * t));
                return baseband[i] * subcarrier * Math.cos(2 * Math.PI * fc * t);
            });
            
        case 'boc61':
            return timeArray.map((t, i) => {
                const subcarrier = Math.sign(Math.sin(2 * Math.PI * 6.138e6 * t));
                return baseband[i] * subcarrier * Math.cos(2 * Math.PI * fc * t);
            });
            
        default:
            return timeArray.map((t, i) => baseband[i] * Math.cos(2 * Math.PI * fc * t));
    }
}

function addNoise(signal, noiseLevel) {
    return signal.map(val => val + (Math.random() - 0.5) * 2 * noiseLevel);
}

function drawBasicModulation(signals) {
    drawInputSignals(signals);
    drawModulationProcess(signals);
    drawFinalOutput(signals);
    drawAnalysis(signals);
}

function drawInputSignals(signals) {
    const canvas = document.getElementById('inputSignalsCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const plotHeight = height / 3;
    const timeEnd = Math.min(1.0, signals.time[signals.time.length - 1]); // Show first 1 second
    const numSamples = Math.floor(signals.time.length * timeEnd / signals.time[signals.time.length - 1]);
    
    // Draw data signal
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < numSamples; i++) {
        const x = (i / numSamples) * width;
        const y = plotHeight * 0.5 - signals.dataSignal[i] * plotHeight * 0.3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw spreading code signal
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < numSamples; i++) {
        const x = (i / numSamples) * width;
        const y = plotHeight * 1.5 - signals.codeSignal[i] * plotHeight * 0.3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw combined baseband
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < numSamples; i++) {
        const x = (i / numSamples) * width;
        const y = plotHeight * 2.5 - signals.combinedBaseband[i] * plotHeight * 0.3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Data Signal', 10, 20);
    ctx.fillText('Spreading Code', 10, plotHeight + 20);
    ctx.fillText('Combined Baseband', 10, 2 * plotHeight + 20);
    
    // Draw bit/chip indicators
    drawBitChipIndicators(ctx, width, plotHeight, signals.parameters.dataRate, signals.parameters.chipRate, timeEnd);
}

function drawModulationProcess(signals) {
    const canvas = document.getElementById('modulationProcessCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const plotHeight = height / 2;
    const timeEnd = Math.min(0.5, signals.time[signals.time.length - 1]); // Show first 0.5 seconds
    const numSamples = Math.floor(signals.time.length * timeEnd / signals.time[signals.time.length - 1]);
    
    // Draw baseband signal
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < numSamples; i++) {
        const x = (i / numSamples) * width;
        const y = plotHeight * 0.5 - signals.combinedBaseband[i] * plotHeight * 0.3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw carrier (decimated for visibility)
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const fc = signals.parameters.carrierFreq * 1e6;
    for (let i = 0; i < numSamples; i += 5) { // Decimate for visibility
        const t = signals.time[i];
        const x = (i / numSamples) * width;
        const carrier = Math.cos(2 * Math.PI * fc * t);
        const y = plotHeight * 1.5 - carrier * plotHeight * 0.2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Baseband Signal', 10, 20);
    ctx.fillText(`Carrier: ${signals.parameters.carrierFreq} MHz`, 10, plotHeight + 20);
    
    // Draw modulation type indicator
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${signals.parameters.carrierType.toUpperCase()} Modulation`, width / 2, height - 20);
}

function drawFinalOutput(signals) {
    const canvas = document.getElementById('finalOutputCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const plotHeight = height / 2;
    const timeEnd = Math.min(0.2, signals.time[signals.time.length - 1]); // Show first 0.2 seconds  
    const numSamples = Math.floor(signals.time.length * timeEnd / signals.time[signals.time.length - 1]);
    
    // Draw modulated signal
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < numSamples; i += 2) { // Decimate for visibility
        const x = (i / numSamples) * width;
        const y = plotHeight * 0.5 - signals.modulatedSignal[i] * plotHeight * 0.4;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw noisy signal if noise > 0
    if (signals.parameters.noiseLevel > 0) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < numSamples; i += 3) {
            const x = (i / numSamples) * width;
            const y = plotHeight * 1.5 - signals.noisySignal[i] * plotHeight * 0.4;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.fillStyle = '#f59e0b';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`With ${(signals.parameters.noiseLevel * 100).toFixed(0)}% Noise`, 10, plotHeight + 20);
    }
    
    // Labels
    ctx.fillStyle = '#e11d48';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Clean Modulated Signal', 10, 20);
    
    // Signal parameters
    ctx.fillStyle = '#333333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Data: ${signals.parameters.dataRate} bps`, width - 10, 20);
    ctx.fillText(`Code: ${signals.parameters.chipRate} cps`, width - 10, 35);
    ctx.fillText(`Carrier: ${signals.parameters.carrierFreq} MHz`, width - 10, 50);
}

function drawAnalysis(signals) {
    const canvas = document.getElementById('analysisCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw spectrum analysis
    drawSpectrumAnalysis(ctx, width / 2, height, signals);
    
    // Draw constellation diagram
    drawConstellationAnalysis(ctx, width / 2, height, signals, width / 2);
}

function drawSpectrumAnalysis(ctx, width, height, signals) {
    // Calculate and draw spectrum
    const numFreqs = 100;
    const freqRange = signals.parameters.carrierFreq * 2; // ±carrier frequency
    const freqStep = freqRange / numFreqs;
    
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < numFreqs; i++) {
        const freq = -freqRange/2 + i * freqStep;
        const power = calculateSpectralDensity(freq, signals.parameters);
        
        const x = (i / numFreqs) * width;
        const y = height - 30 - (power + 80) / 60 * (height - 60);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw frequency axis
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 30);
    ctx.lineTo(width, height - 30);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Power Spectral Density', width / 2, 20);
    ctx.font = '10px Arial';
    ctx.fillText(`${-freqRange/2} MHz`, 0, height - 10);
    ctx.fillText(`${freqRange/2} MHz`, width, height - 10);
}

function drawConstellationAnalysis(ctx, width, height, signals, offsetX) {
    const centerX = offsetX + width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    
    // Draw I/Q axes
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    ctx.beginPath();
    ctx.moveTo(offsetX + 20, centerY);
    ctx.lineTo(offsetX + width - 20, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, height - 20);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Draw constellation points based on modulation type
    ctx.fillStyle = '#dc2626';
    const pointSize = 4;
    
    switch(signals.parameters.carrierType) {
        case 'bpsk':
            // Two points on I axis
            ctx.beginPath();
            ctx.arc(centerX - radius * 0.6, centerY, pointSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + radius * 0.6, centerY, pointSize, 0, 2 * Math.PI);
            ctx.fill();
            break;
            
        case 'qpsk':
            // Four points
            const qpskPoints = [
                {x: 0.6, y: 0.6}, {x: -0.6, y: 0.6},
                {x: -0.6, y: -0.6}, {x: 0.6, y: -0.6}
            ];
            qpskPoints.forEach(point => {
                ctx.beginPath();
                ctx.arc(centerX + radius * point.x, centerY - radius * point.y, pointSize, 0, 2 * Math.PI);
                ctx.fill();
            });
            break;
            
        case '8psk':
            // Eight points in circle
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                const x = centerX + radius * 0.7 * Math.cos(angle);
                const y = centerY - radius * 0.7 * Math.sin(angle);
                ctx.beginPath();
                ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
                ctx.fill();
            }
            break;
            
        default:
            // Default BPSK
            ctx.beginPath();
            ctx.arc(centerX - radius * 0.6, centerY, pointSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + radius * 0.6, centerY, pointSize, 0, 2 * Math.PI);
            ctx.fill();
    }
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Constellation Diagram', centerX, 20);
    ctx.font = '10px Arial';
    ctx.fillText('I', centerX + radius + 10, centerY + 3);
    ctx.save();
    ctx.translate(centerX - 3, centerY - radius - 10);
    ctx.rotate(-Math.PI/2);
    ctx.fillText('Q', 0, 0);
    ctx.restore();
}

function calculateSpectralDensity(freq, params) {
    // Simplified spectral density calculation
    const dataRate = params.dataRate;
    const chipRate = params.chipRate;
    const carrierFreq = params.carrierFreq * 1e6;
    
    // Center frequency offset
    const df = freq * 1e6 - carrierFreq;
    
    // Data component (sinc function)
    const dataComponent = Math.abs(df) < 1e-6 ? 1 : Math.sin(Math.PI * df / dataRate) / (Math.PI * df / dataRate);
    
    // Code component (if spreading is used)
    let codeComponent = 1;
    if (params.codePattern !== 'none') {
        codeComponent = Math.abs(df) < 1e-6 ? 1 : Math.sin(Math.PI * df / chipRate) / (Math.PI * df / chipRate);
    }
    
    // Combined power spectral density in dB
    const power = 20 * Math.log10(Math.abs(dataComponent * codeComponent));
    return Math.max(power, -80); // Limit minimum to -80 dB
}

function drawBitChipIndicators(ctx, width, plotHeight, dataRate, chipRate, timeEnd) {
    // Draw bit boundaries
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    const bitDuration = 1.0 / dataRate;
    for (let t = 0; t <= timeEnd; t += bitDuration) {
        const x = (t / timeEnd) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, plotHeight);
        ctx.stroke();
    }
    
    // Draw chip boundaries
    if (chipRate > dataRate) {
        ctx.strokeStyle = '#2563eb';
        ctx.setLineDash([1, 1]);
        
        const chipDuration = 1.0 / chipRate;
        for (let t = 0; t <= timeEnd; t += chipDuration) {
            const x = (t / timeEnd) * width;
            ctx.beginPath();
            ctx.moveTo(x, plotHeight);
            ctx.lineTo(x, 2 * plotHeight);
            ctx.stroke();
        }
    }
    
    ctx.setLineDash([]);
}

function drawAdvancedGNSS(signals) {
    // Advanced GNSS-specific visualizations
    drawInputSignals(signals);
    drawGNSSModulationProcess(signals);
    drawGNSSOutput(signals);
    drawGNSSAnalysis(signals);
}

function drawGNSSModulationProcess(signals) {
    // Similar to basic but with GNSS-specific annotations
    drawModulationProcess(signals);
    
    const canvas = document.getElementById('modulationProcessCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Add GNSS-specific annotations
    ctx.fillStyle = '#333333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    
    const processingGain = 10 * Math.log10(signals.parameters.chipRate / signals.parameters.dataRate);
    ctx.fillText(`Processing Gain: ${processingGain.toFixed(1)} dB`, width - 10, height - 30);
    
    const bandwidth = signals.parameters.chipRate * 2;
    ctx.fillText(`Bandwidth: ${bandwidth} Hz`, width - 10, height - 15);
}

function drawGNSSOutput(signals) {
    drawFinalOutput(signals);
    
    const canvas = document.getElementById('finalOutputCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Add GNSS performance metrics
    ctx.fillStyle = '#333333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    
    const snr = -10 * Math.log10(signals.parameters.noiseLevel || 0.01);
    ctx.fillText(`Estimated SNR: ${snr.toFixed(1)} dB`, 10, height - 30);
    
    const codeDivision = signals.parameters.codePattern !== 'none';
    ctx.fillText(`CDMA: ${codeDivision ? 'Enabled' : 'Disabled'}`, 10, height - 15);
}

function drawGNSSAnalysis(signals) {
    drawAnalysis(signals);
    
    const canvas = document.getElementById('analysisCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Add correlation properties visualization
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GNSS Signal Properties', width / 2, height - 30);
    
    ctx.font = '10px Arial';
    const autocorr = signals.parameters.codePattern !== 'none' ? 'Good' : 'Poor';
    const multipath = signals.parameters.codePattern !== 'none' ? 'Resistant' : 'Susceptible';
    
    ctx.fillText(`Autocorrelation: ${autocorr}`, width / 4, height - 15);
    ctx.fillText(`Multipath: ${multipath}`, 3 * width / 4, height - 15);
}

function drawSideBySideComparison(signals) {
    // Show two different configurations side by side
    // This would need additional UI controls to set the comparison parameters
    drawBasicModulation(signals);
    
    // Add comparison labels
    const canvases = ['inputSignalsCanvas', 'modulationProcessCanvas', 'finalOutputCanvas', 'analysisCanvas'];
    
    canvases.forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const dims = getCanvasDimensions(canvas);
        
        // Draw vertical line to separate comparison
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(dims.width / 2, 0);
        ctx.lineTo(dims.width / 2, dims.height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Add labels
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Configuration A', dims.width / 4, 15);
        ctx.fillText('Configuration B', 3 * dims.width / 4, 15);
    });
}

function drawInteractiveBuilder(signals) {
    // Interactive step-by-step signal building
    drawBasicModulation(signals);
    
    // Add step indicators
    const canvas = document.getElementById('inputSignalsCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    
    // Add step numbers
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    
    const steps = ['1', '2', '3'];
    const stepY = [dims.height / 6, dims.height / 2, 5 * dims.height / 6];
    
    steps.forEach((step, i) => {
        ctx.beginPath();
        ctx.arc(dims.width - 30, stepY[i], 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(step, dims.width - 30, stepY[i] + 4);
        ctx.fillStyle = '#ffffff';
    });
}

// Animation functions
function playSignalAnimation() {
    const button = event.target;
    const isRunning = playgroundAnimationId !== null;
    
    if (isRunning) {
        cancelAnimationFrame(playgroundAnimationId);
        playgroundAnimationId = null;
        button.textContent = '🎬 Play Signal Animation';
        updatePlayground(); // Reset to static view
        return;
    }
    
    button.textContent = '⏹️ Stop Animation';
    
    let step = 0;
    const animate = () => {
        const progress = (step % 200) / 200; // 3.33-second loop at 60fps
        
        animatePlaygroundSignals(progress, step);
        
        step++;
        playgroundAnimationId = requestAnimationFrame(animate);
    };
    
    animate();
}

function animatePlaygroundSignals(progress, step) {
    // Animate the signal generation process
    const mode = document.getElementById('playgroundMode').value;
    
    // Generate base signals
    const signals = generatePlaygroundSignals(
        document.getElementById('dataPattern').value,
        document.getElementById('codePattern').value,
        document.getElementById('carrierType').value,
        parseFloat(document.getElementById('carrierFreqPG').value),
        parseInt(document.getElementById('dataRatePG').value),
        parseInt(document.getElementById('chipRatePG').value),
        parseFloat(document.getElementById('noiseLevelPG').value)
    );
    
    // Animate each canvas based on progress
    animateInputSignalsProgress(signals, progress);
    animateModulationProgress(signals, progress);
    animateFinalOutputProgress(signals, progress);
    animateAnalysisProgress(signals, progress);
}

function animateInputSignalsProgress(signals, progress) {
    const canvas = document.getElementById('inputSignalsCanvas');
    if (!canvas) return;
    
    // Draw partial signals based on progress
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    const width = dims.width;
    const height = dims.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const plotHeight = height / 3;
    const timeEnd = Math.min(1.0, signals.time[signals.time.length - 1]);
    const visibleSamples = Math.floor(signals.time.length * timeEnd / signals.time[signals.time.length - 1] * progress);
    
    // Draw signals up to current progress
    if (visibleSamples > 0) {
        // Data signal
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < visibleSamples && i < signals.dataSignal.length; i++) {
            const x = (i / signals.dataSignal.length) * width * (timeEnd / signals.time[signals.time.length - 1]);
            const y = plotHeight * 0.5 - signals.dataSignal[i] * plotHeight * 0.3;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Add moving indicator
        if (visibleSamples < signals.dataSignal.length) {
            const currentX = (visibleSamples / signals.dataSignal.length) * width * (timeEnd / signals.time[signals.time.length - 1]);
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(currentX, 0);
            ctx.lineTo(currentX, plotHeight);
            ctx.stroke();
        }
    }
    
    // Labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Building Signal... ${(progress * 100).toFixed(0)}%`, 10, 20);
}

function animateModulationProgress(signals, progress) {
    // Similar animation for modulation process
    drawModulationProcess(signals);
    
    const canvas = document.getElementById('modulationProcessCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    
    // Add progress overlay
    ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
    ctx.fillRect(0, 0, dims.width * progress, dims.height);
    
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Modulating... ${(progress * 100).toFixed(0)}%`, dims.width / 2, 30);
}

function animateFinalOutputProgress(signals, progress) {
    drawFinalOutput(signals);
    
    const canvas = document.getElementById('finalOutputCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    
    // Add signal strength indicator that builds up
    const barWidth = 200;
    const barHeight = 20;
    const barX = dims.width - barWidth - 20;
    const barY = 20;
    
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = '#059669';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Signal Strength: ${(progress * 100).toFixed(0)}%`, barX + barWidth / 2, barY - 5);
}

function animateAnalysisProgress(signals, progress) {
    drawAnalysis(signals);
    
    // Add scanning beam effect on spectrum
    const canvas = document.getElementById('analysisCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dims = getCanvasDimensions(canvas);
    
    const beamX = progress * dims.width / 2; // Only on spectrum side
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.fillRect(beamX - 10, 0, 20, dims.height);
}

function resetPlayground() {
    // Reset all controls to default values
    document.getElementById('playgroundMode').value = 'basic';
    document.getElementById('dataPattern').value = 'binary';
    document.getElementById('codePattern').value = 'none';
    document.getElementById('carrierType').value = 'bpsk';
    document.getElementById('carrierFreqPG').value = '5';
    document.getElementById('dataRatePG').value = '10';
    document.getElementById('chipRatePG').value = '31';
    document.getElementById('noiseLevelPG').value = '0.1';
    document.getElementById('customData').value = '';
    
    // Stop any running animation
    if (playgroundAnimationId) {
        cancelAnimationFrame(playgroundAnimationId);
        playgroundAnimationId = null;
        
        const button = document.querySelector('button[onclick="playSignalAnimation()"]');
        if (button) button.textContent = '🎬 Play Signal Animation';
    }
    
    // Update display
    updatePlayground();
}
