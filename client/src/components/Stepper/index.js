import './index.css';

function Stepper() {
  
  
  return (
    <div className='bs-stepper'>
      <div class="bs-stepper-header" role="tablist">
        <div class="step" data-target="#logins-part">
          <button type="button" class="step-trigger" role="tab" aria-controls="logins-part" id="logins-part-trigger">
            <span class="bs-stepper-circle">1</span>
          </button>
        </div>
        <div class="line"></div>
        <div class="step" data-target="#information-part">
          <button type="button" class="step-trigger" role="tab" aria-controls="information-part" id="information-part-trigger">
            <span class="bs-stepper-circle">2</span>
          </button>
        </div>
        <div class="line"></div>
        <div class="step" data-target="#information-part">
          <button type="button" class="step-trigger" role="tab" aria-controls="information-part" id="information-part-trigger">
            <span class="bs-stepper-circle">3</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Stepper;
