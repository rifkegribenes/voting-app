// //////// FORM VALIDATION FUNCTIONS //////////

const _isRequired = fieldName => `${fieldName} is required`;

const _mustMatch = otherFieldName => fieldName =>
  `${fieldName} must match ${otherFieldName}`;

const _minLength = length => fieldName =>
  `${fieldName} must be at least ${length} characters`;

export const required = text => {
  if (text) {
    return null;
  }
  return _isRequired;
};

export const conditionalRequired = (text, fieldName) => (text2, state) =>
  state[fieldName] !== "" && text2 === "" ? _isRequired : null;

export const mustMatch = (field, fieldName) => (text, state) =>
  state[field] === text ? null : _mustMatch(fieldName);

export const minLength = length => text =>
  text.length >= length ? null : _minLength(length);

export const ruleRunner = (field, name, ...validations) => state => {
  const errorMessageFunc = validations.find(v => v(state[field], state));
  if (errorMessageFunc) {
    return { [field]: errorMessageFunc(state[field], state)(name) };
  }
  return {};
};

export const run = (state, runners) =>
  runners.reduce((memo, runner) => Object.assign(memo, runner(state)), {});

export const fieldValidations = {
  login: [
    ruleRunner("email", "Email", required),
    ruleRunner("password", "Password", required)
  ],
  resetPwd: [
    ruleRunner("password", "Password", required, minLength(6)),
    ruleRunner(
      "confirmPwd",
      "Password Confirmation",
      mustMatch("password", "Password")
    )
  ],
  reset: [ruleRunner("email", "Email", required)],
  signup: [
    ruleRunner("firstName", "First Name", required),
    ruleRunner("lastName", "Last Name", required),
    ruleRunner("email", "Email", required),
    ruleRunner("password", "Password", required, minLength(6)),
    ruleRunner(
      "confirmPwd",
      "Password Confirmation",
      mustMatch("password", "Password")
    )
  ]
};

// force focus on #main when using skip navigation link
// (some browsers will only focus form inputs, links, and buttons)
export const skip = targetId => {
  const removeTabIndex = e => {
    e.target.removeAttribute("tabindex");
  };
  const skipTo = document.getElementById(targetId);
  // Setting 'tabindex' to -1 takes an element out of normal
  // tab flow but allows it to be focused via javascript
  skipTo.tabIndex = -1;
  skipTo.focus(); // focus on the content container
  // console.log(document.activeElement);
  // when focus leaves this element,
  // remove the tabindex attribute
  skipTo.addEventListener("blur", removeTabIndex);
};
