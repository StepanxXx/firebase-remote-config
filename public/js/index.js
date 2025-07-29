document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/template');
    if (!response.ok) {
      throw new Error('Failed to fetch template data');
    }
    const template = await response.json();

    document.getElementById('parameters').value = JSON.stringify(template.parameters, null, 2);
    document.getElementById('parameterGroups').value = JSON.stringify(template.parameterGroups, null, 2);
    document.getElementById('conditions').value = JSON.stringify(template.conditions, null, 2);
  } catch (error) {
    console.error('Error loading template:', error);
  }

  document.getElementById('submit-button').addEventListener('click', async () => {
    const parameters = document.getElementById('parameters').value;
    const parameterGroups = document.getElementById('parameterGroups').value;
    const conditions = document.getElementById('conditions').value;

    try {
      const response = await fetch('/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameters: JSON.parse(parameters),
          parameterGroups: JSON.parse(parameterGroups),
          conditions: JSON.parse(conditions),
        }),
      });

      if (response.ok) {
        alert('Configuration updated successfully!');
      } else {
        const error = await response.text();
        alert(`Failed to update configuration: ${error}`);
      }
    } catch (error) {
      console.error('Error submitting configuration:', error);
      alert('An error occurred while submitting the configuration.');
    }
  });
});
