              // Function to show modals
        function showModal(modalId) {
            document.getElementById(modalId).style.display = 'flex';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        function showHelp() {
            showModal('helpModal');
        }

        function showAbout() {
            showModal('aboutModal');
        }

        // Close modals when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }
        
function resetForm() {
            document.getElementById('fileInput').value = '';
            document.getElementById('password').value = '';
            document.getElementById('status').textContent = '';
            document.getElementById('status').style.display = 'none';
        }

        const MAX_FILE_SIZE_MB = 5;

        // Toggle password visibility
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
            } else {
                passwordInput.type = 'password';
            }
        }

        // Show password strength
        document.getElementById('password').addEventListener('input', function () {
            const password = this.value;
            const strengthIndicator = document.getElementById('passwordStrength');
            if (password.length < 6) {
                strengthIndicator.textContent = 'Weak (use at least 6 characters)';
                strengthIndicator.style.color = '#e74c3c';
            } else if (password.length < 10) {
                strengthIndicator.textContent = 'Moderate (use at least 10 characters)';
                strengthIndicator.style.color = '#f39c12';
            } else {
                strengthIndicator.textContent = 'Strong';
                strengthIndicator.style.color = '#27ae60';
            }
        });

        // Validate file size
        document.getElementById('fileInput').addEventListener('change', function () {
            const file = this.files[0];
            const fileSizeWarning = document.getElementById('fileSizeWarning');
            const encryptBtn = document.getElementById('encryptBtn');
            const decryptBtn = document.getElementById('decryptBtn');

            if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                fileSizeWarning.style.display = 'block';
                encryptBtn.disabled = true;
                decryptBtn.disabled = true;
            } else {
                fileSizeWarning.style.display = 'none';
                encryptBtn.disabled = false;
                decryptBtn.disabled = false;
            }
        });

        // Helper function to prepare file download
        function prepareDownload(data, fileName) {
            const downloadButton = document.getElementById('downloadButton');
            const downloadSection = document.getElementById('downloadSection');

            const blob = new Blob([data]);
            const downloadUrl = URL.createObjectURL(blob);

            downloadButton.onclick = () => {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
            };

            downloadSection.style.display = 'block';
        }

        // Generate key from password
        async function generateKey(password) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            return await crypto.subtle.digest('SHA-256', data);
        }

        // Encrypt file
        async function encryptFile() {
            try {
                const fileInput = document.getElementById('fileInput');
                const password = document.getElementById('password').value;

                if (!fileInput.files.length || !password) {
                    showStatus('Please select a file and enter a password', true);
                    return;
                }

                const file = fileInput.files[0];
                const key = await generateKey(password);

                const iv = crypto.getRandomValues(new Uint8Array(12));
                const cryptoKey = await crypto.subtle.importKey(
                    'raw',
                    key,
                    { name: 'AES-GCM', length: 256 },
                    false,
                    ['encrypt']
                );

                const fileData = await file.arrayBuffer();
                const encryptedData = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv: iv },
                    cryptoKey,
                    fileData
                );

                const result = new Uint8Array(iv.length + encryptedData.byteLength);
                result.set(iv);
                result.set(new Uint8Array(encryptedData), iv.length);

                prepareDownload(result, file.name + '.encrypted');
                showStatus('File encrypted successfully!');
                resetForm();
            } catch (error) {
                showStatus('Encryption failed: ' + error.message, true);
            }
        }

        // Decrypt file
        async function decryptFile() {
            try {
                const fileInput = document.getElementById('fileInput');
                const password = document.getElementById('password').value;

                if (!fileInput.files.length || !password) {
                    showStatus('Please select a file and enter a password', true);
                    return;
                }

                const file = fileInput.files[0];
                const key = await generateKey(password);

                const fileData = await file.arrayBuffer();
                const iv = new Uint8Array(fileData.slice(0, 12));
                const encryptedData = new Uint8Array(fileData.slice(12));

                const cryptoKey = await crypto.subtle.importKey(
                    'raw',
                    key,
                    { name: 'AES-GCM', length: 256 },
                    false,
                    ['decrypt']
                );

                const decryptedData = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv },
                    cryptoKey,
                    encryptedData
                );

                prepareDownload(decryptedData, file.name.replace('.encrypted', ''));
                showStatus('File decrypted successfully!');
                resetForm();
            } catch (error) {
                showStatus('Decryption failed. Make sure you have the correct password.', true);
            }
        }

        // Show status messages
        function showStatus(message, isError = false) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.style.display = 'block';
            status.className = isError ? 'error' : 'success';
        }