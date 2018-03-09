import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import PropTypes from "prop-types";
import update from "immutability-helper";

import Spinner from "./Spinner";
import ModalSm from "./ModalSm";
import FormInput from "./FormInput";
import { fieldValidations, run } from "../utils/";
import * as Actions from "../store/actions";
import * as apiActions from "../store/actions/apiActions";

class ComboBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      form: props.initialForm,
      showFormErrors: false,
      showFieldErrors: {
        firstName: false,
        lastName: false,
        email: false,
        password: false,
        confirmPwd: false
      },
      validationErrors: {},
      touched: {
        firstName: false,
        lastName: false,
        email: false,
        password: false,
        confirmPwd: false
      },
      submit: false
    };

    this.toggleForm = this.toggleForm.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.errorFor = this.errorFor.bind(this);
  }

  componentDidMount() {
    // clear previous errors
    this.props.actions.clearFormError();
  }

  toggleForm(form) {
    const newState = { ...this.state };
    newState.form = form;
    this.setState({ ...newState });
  }

  /* Function login - Perform basic validation:
  * - username is at least 1 char
  * - password is at least 1 char
  * If valid, call the login route; store token in redux, clear password from state
  * , return to Home
  */
  login() {
    const { email, password } = this.props.login.form;

    // show validation errors
    const newState = { ...this.state };
    newState.submit = true;
    newState.showFormErrors = true;

    const validationErrors = run(this.props.login.form, fieldValidations.login);

    newState.validationErrors = { ...validationErrors };
    this.setState({ ...newState });

    if (email && password) {
      const body = { email, password };
      this.props.api.login(body).then(result => {
        if (result.type === "LOGIN_SUCCESS") {
          this.props.history.push("/");
        }
      });
    } else if (!email) {
      this.props.actions.setFormError("Email cannot be blank");
    } else if (!password) {
      this.props.actions.setFormError("Password cannot be blank");
    }
  }

  /* Function handleRegister - Perform basic validation:
  * - username is at least 1 char
  * - password is at least 1 char
  * - password confirmation matches
  * If valid, call the register route; store token in redux, clear password
  * from state, return to Home
  */
  register() {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPwd
    } = this.props.login.form;

    // show validation errors
    const newState = { ...this.state };
    newState.submit = true;
    newState.showFormErrors = true;

    const validationErrors = run(
      this.props.login.form,
      fieldValidations.register
    );
    newState.validationErrors = { ...validationErrors };
    this.setState({ ...newState });

    if (!Object.values(this.state.validationErrors).length) {
      const body = { firstName, lastName, email, password };
      this.props.api
        .registration(body)
        .then(result => {
          if (result.type === "REGISTRATION_FAILURE") {
            this.props.actions.showErrors(true);
          }
          if (result.type === "REGISTRATION_SUCCESS") {
            // clear form
            this.props.actions.setFormField({
              firstName: "",
              lastName: "",
              email: "",
              password: "",
              confirmPwd: "",
              error: ""
            });
            // this.props.history.push("/");
          }
        })
        .catch(err => {
          let error;
          typeof err === "string"
            ? (error = err)
            : typeof err.error === "string"
              ? (error = err.error)
              : typeof err.message === "string"
                ? (error = err.message)
                : (error = undefined);
          this.props.actions.setFormError(error);
          this.props.actions.setFormField({
            error: err
          });
          // show validation errors
          const newState = { ...this.state };
          newState.showFormErrors = true;
          this.setState({ ...newState });
        });
    } else if (!email) {
      this.props.actions.setFormError("Email cannot be blank");
    } else if (password !== confirmPwd) {
      this.props.actions.setFormError("Passwords do not match");
    } else if (!firstName || !lastName) {
      this.props.actions.setFormError("Full name is required");
    } else {
      this.props.actions.setFormError("Please complete the form");
    }
  }

  reset() {
    const email = this.props.login.form.email;
    if (!email) {
      this.props.actions.setFormError("Email required to reset password");
    } else {
      this.props.api.sendResetEmail({ email });
    }
  }

  /*
  * Function: handleInput - On Change, send updated value to redux
  * @param {object} event - the change event triggered by the input.
  * All form inputs will use this handler; trigger the proper action
  * based on the input ID
  */
  handleInput(e) {
    this.props.actions.setFormField(e.target.id, e.target.value);
    if (e.which === 13) {
      this.login();
    }
  }

  handleBlur(e) {
    const field = e.target.name;

    // run fieldValidations on fields in form object and save to state
    const validationErrors = run(
      this.props.login.form,
      fieldValidations[this.state.form]
    );

    const showFormErrors = !!Object.values(validationErrors).length;

    // set current field as 'touched' and display errors onBlur
    const newState = update(this.state, {
      touched: {
        [field]: { $set: true }
      },
      showFieldErrors: {
        [field]: { $set: true }
      },
      validationErrors: { $set: { ...validationErrors } },
      showFormErrors: { $set: showFormErrors }
    });

    this.setState({ ...newState });
  }

  handleFocus(e) {
    const field = e.target.name;

    // hide validation errors for focused field
    const validationErrors = run(
      this.props.login.form,
      fieldValidations[this.state.form]
    );
    validationErrors[field] = false;

    const newState = update(this.state, {
      showFieldErrors: {
        [field]: { $set: false }
      },
      validationErrors: { $set: { ...validationErrors } },
      showFormErrors: { $set: false }
    });

    this.setState({ ...newState });
  }

  errorFor(field) {
    // run validation check and return error(s) for this field
    if (Object.values(this.state.validationErrors).length) {
      if (
        this.state.validationErrors[field] &&
        (this.state.showFormErrors === true ||
          this.state.showFieldErrors[field] === true)
      ) {
        return this.state.validationErrors[field] || "";
      }
    }
    return null;
  }

  render() {
    const login = this.state.form === "login";
    const signup = this.state.form === "signup";
    const reset = this.state.form === "reset";
    const buttonText = login ? "Log In" : signup ? "Sign Up" : "Send Email";
    const buttonState = this.state.showFormErrors
      ? "form__button--disabled"
      : "";
    const method = login ? this.login : signup ? this.register : this.reset;
    const errorClass =
      this.props.register.errorMsg || this.props.login.form.error
        ? "error"
        : "hidden";
    return (
      <div className="container combo">
        <div className="combo__header">
          <div className="combo__logo-wrap">
            <img className="combo__logo" src="" alt="" />
          </div>
          <div className="combo__title">
            {reset ? "Reset your password" : "Voting App"}
          </div>
        </div>
        {this.state.form !== "reset" && (
          <div className="combo__nav">
            <button
              className="combo__nav-button"
              onClick={() => this.toggleForm("login")}
            >
              Log in
            </button>
            <button
              className="combo__nav-button"
              onClick={() => this.toggleForm("signup")}
            >
              Sign Up
            </button>
          </div>
        )}
        <div className="combo__social-wrap">
          <a
            className="form__button form__button--github"
            href="http://localhost:8080/api/auth/github/"
            id="btn-github"
          >
            <span>{`${buttonText} with Github`}</span>
          </a>
          <a
            className="form__button form__button--facebook"
            id="btn-facebook"
            href="http://localhost:8080/api/auth/facebook"
          >
            <span>{`${buttonText} with Facebook`}</span>
          </a>
          <a
            className="form__button form__button--google"
            id="btn-google"
            href="http://localhost:8080/api/auth/google"
          >
            <span>{`${buttonText} with Google`}</span>
          </a>
        </div>
        <div className="combo__form">
          <form className="container form">
            <div className="form__body">
              {!reset && <div className="form__input-group">or&hellip;</div>}
              {signup && (
                <div>
                  <div className="form__input-group">
                    <FormInput
                      handleChange={this.handleInput}
                      handleBlur={this.handleBlur}
                      handleFocus={this.handleFocus}
                      placeholder="First name"
                      autoComplete="given-name"
                      showError={this.state.showFieldErrors.firstName}
                      value={this.props.login.form.firstName}
                      errorText={this.errorFor("firstName")}
                      touched={this.state.touched.firstName}
                      name="firstName"
                      submit={this.state.submit}
                    />
                  </div>
                  <div className="form__input-group">
                    <FormInput
                      handleChange={this.handleInput}
                      handleBlur={this.handleBlur}
                      handleFocus={this.handleFocus}
                      placeholder="Last name"
                      autoComplete="family-name"
                      showError={this.state.showFieldErrors.lastName}
                      value={this.props.login.form.lastName}
                      errorText={this.errorFor("lastName")}
                      touched={this.state.touched.lastName}
                      name="lastName"
                      submit={this.state.submit}
                    />
                  </div>
                </div>
              )}
              <div className="form__input-group">
                <FormInput
                  handleChange={this.handleInput}
                  handleBlur={this.handleBlur}
                  handleFocus={this.handleFocus}
                  placeholder="Email"
                  autoComplete="email"
                  type="email"
                  showError={this.state.showFieldErrors.email}
                  value={this.props.login.form.email}
                  errorText={this.errorFor("email")}
                  touched={this.state.touched.email}
                  name="email"
                  inputRef={el => (this.emailInput = el)}
                  submit={this.state.submit}
                />
              </div>
              {!reset && (
                <div className="form__input-group">
                  <FormInput
                    handleChange={this.handleInput}
                    handleBlur={this.handleBlur}
                    handleFocus={this.handleFocus}
                    placeholder="Password"
                    autoComplete="new-password"
                    type="password"
                    showError={this.state.showFieldErrors.password}
                    value={this.props.login.form.password}
                    errorText={this.errorFor("password")}
                    touched={this.state.touched.password}
                    name="password"
                    submit={this.state.submit}
                  />
                </div>
              )}
              {signup && (
                <div className="form__input-group">
                  <FormInput
                    handleChange={this.handleInput}
                    handleBlur={this.handleBlur}
                    handleFocus={this.handleFocus}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    type="password"
                    showError={this.state.showFieldErrors.confirmPwd}
                    value={this.props.login.form.confirmPwd}
                    errorText={this.errorFor("confirmPwd")}
                    touched={this.state.touched.confirmPwd}
                    name="confirmPwd"
                    submit={this.state.submit}
                  />
                </div>
              )}
              <div className="form__input-group">
                <div className="form__button-wrap">
                  <button
                    className={`form__button ${buttonState}`}
                    id={`btn-${this.state.form}`}
                    type="button"
                    onClick={method}
                    disabled={this.state.showFormErrors}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
              <div className="form__input-group">
                <div className={errorClass}>{this.props.login.errorMsg}</div>
              </div>
            </div>
          </form>
        </div>
        <Spinner cssClass={this.props.login.spinnerClass} />
        <ModalSm
          modalClass={this.props.login.modal.class}
          modalText={this.props.login.modal.text}
          modalTitle={this.props.login.modal.title}
          modalType={this.props.login.modal.type}
          buttonText={this.props.login.modal.buttonText || "Continue"}
          dismiss={() => {
            this.props.actions.dismissModal();
          }}
          action={this.props.login.modal.action}
        />
      </div>
    );
  }
}

ComboBox.propTypes = {
  actions: PropTypes.shape({
    dismissModal: PropTypes.func,
    setFormField: PropTypes.func,
    setFormError: PropTypes.func,
    clearFormError: PropTypes.func
  }).isRequired,
  api: PropTypes.shape({
    resetPassword: PropTypes.func
  }).isRequired,
  login: PropTypes.shape({
    form: PropTypes.shape({
      email: PropTypes.string,
      password: PropTypes.string,
      confirmPwd: PropTypes.string
    }).isRequired,
    modal: PropTypes.shape({
      class: PropTypes.string,
      text: PropTypes.string,
      title: PropTypes.string,
      type: PropTypes.string,
      buttonText: PropTypes.string,
      action: PropTypes.func
    }).isRequired,
    spinnerClass: PropTypes.string
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      key: PropTypes.string
    })
  }).isRequired
};

const mapStateToProps = state => ({
  login: state.login,
  register: state.register
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(Actions, dispatch),
  api: bindActionCreators(apiActions, dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(ComboBox);
