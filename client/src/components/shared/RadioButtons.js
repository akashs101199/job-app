import React, { useState } from 'react';
import '../../styles/App.css';

const RadioButtons = () => {
  const [selectedOption, setSelectedOption] = useState('');

  const handleChange = (event) => {
    setSelectedOption(event.target.value);
  };

  return (
    <div className="user-type">
      <label> Gender:
        <label className="labelG">
          <input
            type="radio"
            name="gender"
            value="Male"
            checked={selectedOption === 'Male'}
            onChange={handleChange}
          />
          Male
        </label>

        <label className="labelG">
          <input
            type="radio"
            name="gender"
            value="Female"
            checked={selectedOption === 'Female'}
            onChange={handleChange}
          />
          Female
        </label>
      </label>
    </div>
  );
};

export default RadioButtons;
