import tweenState from 'react-tween-state';
import NativeButton from './NativeButton';
import styles from './styles';

import React, {
  Component,
} from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

import {
  PanResponder,
  TouchableHighlight,
  StyleSheet,
  Text,
  View,
  ViewPropTypes,
} from 'react-native';

const SwipeoutBtn = createReactClass({

  propTypes: {
    backgroundColor: PropTypes.string,
    color: PropTypes.string,
    component: PropTypes.node,
    onPress: PropTypes.func,
    onPressIn: PropTypes.func,
    onPressOut: PropTypes.func,
    text: PropTypes.string,
    type: PropTypes.string,
    underlayColor: PropTypes.string,
  },

  getDefaultProps: function() {
    return {
      backgroundColor: null,
      color: null,
      component: null,
      underlayColor: null,
      height: 0,
      onPress: null,
      onPressIn: null,
      onPressOut: null,
      disabled: false,
      text: 'Click me',
      type: '',
      width: 0,
    };
  },

  render: function() {
    var btn = this.props;

    var styleSwipeoutBtn = [styles.swipeoutBtn];

    //  apply "type" styles (delete || primary || secondary)
    if (btn.type === 'delete') styleSwipeoutBtn.push(styles.colorDelete);
    else if (btn.type === 'primary') styleSwipeoutBtn.push(styles.colorPrimary);
    else if (btn.type === 'secondary') styleSwipeoutBtn.push(styles.colorSecondary);

    //  apply background color
    if (btn.backgroundColor) styleSwipeoutBtn.push([{ backgroundColor: btn.backgroundColor }]);

    styleSwipeoutBtn.push([{
      height: btn.height,
      width: btn.width,
    }]);

    var styleSwipeoutBtnComponent = [];

    //  set button dimensions
    styleSwipeoutBtnComponent.push([{
      height: btn.height,
      width: btn.width,
    }]);

    var styleSwipeoutBtnText = [styles.swipeoutBtnText];

    //  apply text color
    if (btn.color) styleSwipeoutBtnText.push([{ color: btn.color }]);

    return  (
      <NativeButton
        onPress={this.props.onPress}
        onPressIn={this.props.onPressIn}
        onPressOut={this.props.onPressOut}
        underlayColor={this.props.underlayColor}
        disabled={this.props.disabled}
        style={[styles.swipeoutBtnTouchable, styleSwipeoutBtn]}
        textStyle={styleSwipeoutBtnText}>
        {
          (btn.component ?
            <View style={styleSwipeoutBtnComponent}>{btn.component}</View>
            :
            btn.text
          )
        }
      </NativeButton>
    );
  }
});

const Swipeout = createReactClass({
  mixins: [tweenState.Mixin],

  propTypes: {
    autoClose: PropTypes.bool,
    backgroundColor: PropTypes.string,
    close: PropTypes.bool,
    left: PropTypes.array,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onMove: PropTypes.func,
    onEnd: PropTypes.func,
    onButtonPress: PropTypes.func,
    onButtonPressIn: PropTypes.func,
    onButtonPressOut: PropTypes.func,
    right: PropTypes.array,
    scroll: PropTypes.func,
    style: (ViewPropTypes || View.propTypes).style,
    sensitivity: PropTypes.number,
    buttonWidth: PropTypes.number,
    disabled: PropTypes.bool,
    tweenDuration: PropTypes.number,
    callbackOnTouch: PropTypes.bool
  },

  getDefaultProps: function() {
    return {
      disabled: false,
      rowID: -1,
      sectionID: -1,
      sensitivity: 50,
      callbackOnTouch:true,
      tweenDuration:160,
    };
  },

  getInitialState: function() {
    return {
      autoClose: this.props.autoClose || false,
      btnWidth: 0,
      btnsLeftWidth: 0,
      btnsRightWidth: 0,
      contentHeight: 0,
      contentPos: 0,
      contentWidth: 0,
      openedRight: false,
      swiping: false,
      timeStart: null,
    };
  },

  componentWillMount: function() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onStartShouldSetPanResponderCapture: (event, gestureState) =>
        this.state.openedLeft || this.state.openedRight,
      onMoveShouldSetPanResponderCapture: (event, gestureState) =>
        Math.abs(gestureState.dx) > this.props.sensitivity &&
        Math.abs(gestureState.dy) <= this.props.sensitivity,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
      onShouldBlockNativeResponder: (event, gestureState) => false,
      onPanResponderTerminationRequest: () => false,
    });
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.close) this._close();
    if (nextProps.openRight) this._openRight();
    if (nextProps.openLeft) this._openLeft();
  },

  _handlePanResponderGrant: function(e: Object, gestureState: Object) {
    if (this.props.disabled) return;
    if (!this.state.openedLeft && !this.state.openedRight) {
      this._callOnOpen();
    } else {
      this._callOnClose();
    }
    this.refs.swipeoutContent.measure((ox, oy, width, height) => {
      let buttonWidth = this.props.buttonWidth || (width/5);
      this.setState({
        btnWidth: buttonWidth,
        btnsLeftWidth: this.props.left ? buttonWidth*this.props.left.length : 0,
        btnsRightWidth: this.props.right ? buttonWidth*this.props.right.length : 0,
        swiping: true,
        timeStart: (new Date()).getTime(),
      });
    });
  },

  _handlePanResponderMove: function(e: Object, gestureState: Object) {
    if (this.props.disabled) return;

    this._callOnMove();

    var posX = gestureState.dx;
    var posY = gestureState.dy;
    var leftWidth = this.state.btnsLeftWidth;
    var rightWidth = this.state.btnsRightWidth;
    if (this.state.openedRight) var posX = gestureState.dx - rightWidth;
    else if (this.state.openedLeft) var posX = gestureState.dx + leftWidth;

    //  prevent scroll if moveX is true
    var moveX = Math.abs(posX) > Math.abs(posY);
    if (this.props.scroll) {
      if (moveX) this.props.scroll(false);
      else this.props.scroll(true);
    }
    if (this.state.swiping) {
      //  move content to reveal swipeout
      if (posX < 0 && this.props.right) {
        this.setState({ contentPos: Math.min(posX, 0) })
      } else if (posX > 0 && this.props.left) {
        this.setState({ contentPos: Math.max(posX, 0) })
      };
    }
  },

  _handlePanResponderEnd: function(e: Object, gestureState: Object) {
    if (this.props.disabled) return;
    var posX = gestureState.dx;
    var contentPos = this.state.contentPos;
    var contentWidth = this.state.contentWidth;
    var btnsLeftWidth = this.state.btnsLeftWidth;
    var btnsRightWidth = this.state.btnsRightWidth;

    //  minimum threshold to open swipeout
    var openX = contentWidth*0.33;

    //  should open swipeout
    var openLeft = posX > openX || posX > btnsLeftWidth/2;
    var openRight = posX < -openX || posX < -btnsRightWidth/2;

    //  account for open swipeouts
    if (this.state.openedRight) var openRight = posX-openX < -openX;
    if (this.state.openedLeft) var openLeft = posX+openX > openX;

    //  reveal swipeout on quick swipe
    var timeDiff = (new Date()).getTime() - this.state.timeStart < 200;
    if (timeDiff) {
      var openRight = posX < -openX/10 && !this.state.openedLeft;
      var openLeft = posX > openX/10 && !this.state.openedRight;
    }

    if (this.state.swiping) {
      if (openRight && contentPos < 0 && posX < 0) {
        this._open(-btnsRightWidth, 'right');
      } else if (openLeft && contentPos > 0 && posX > 0) {
        this._open(btnsLeftWidth, 'left');
      } else {
        this._close();
      }
    }

    //  Allow scroll
    if (this.props.scroll) this.props.scroll(true);
  },

  _tweenContent: function(state, endValue) {
    const duration = endValue === 0 ? this.props.tweenDuration*1.5 : this.props.tweenDuration,
    this.tweenState(state, {
      easing: tweenState.easingTypes.easeInOutQuad,
      duration: duration,
      endValue: endValue,
    });
  },

  _rubberBandEasing: function(value, limit) {
    if (value < 0 && value < limit) return limit - Math.pow(limit - value, 0.85);
    else if (value > 0 && value > limit) return limit + Math.pow(value - limit, 0.85);
    return value;
  },

  //  close swipeout on button press
  _autoClose: function(btn, index, isLeft) {
    if (this.state.autoClose) this._close();
    var onPress = btn.onPress;
    if (onPress) onPress();

    this._callOnButtonPress(btn, index, isLeft)
    
  },

  _open: function(contentPos, direction) {
    const left = direction === 'left';
    const { sectionID, rowID, onOpen } = this.props;
    onOpen && onOpen(sectionID, rowID, direction);
    this._tweenContent('contentPos', contentPos);
    this.setState({
      contentPos,
      openedLeft: left,
      openedRight: !left,
      swiping: false,
    });
  },

  _close: function() {
    this._tweenContent('contentPos', 0);

    const { sectionID, rowID, onClose } = this.props;
    if (onClose && (this.state.openedLeft || this.state.openedRight)) {
      const direction = this.state.openedRight ? 'right' : 'left';
      onClose(sectionID, rowID, direction);
    }
    else {
      this._callOnClose();
    }
    this.setState({
      openedRight: false,
      openedLeft: false,
      swiping: false,
    });
  },

  _callOnClose: function() {
    if (this.props.onClose) this.props.onClose(this.props.sectionID, this.props.rowID);
  },

  _callOnOpen: function() {
    if (this.props.onOpen) this.props.onOpen(this.props.sectionID, this.props.rowID);
  },

  _callOnMove: function() {
    if (this.props.onMove) this.props.onMove(this.props.sectionID, this.props.rowID);
  },
  
  _callOnEnd: function() {
    if (this.props.onEnd) this.props.onEnd(this.props.sectionID, this.props.rowID);
  },
  
  _callOnButtonPress: function(index, isLeft) {
    if (this.props.onButtonPress) this.props.onButtonPress(this.props.sectionID, this.props.rowID, index, isLeft);
  },
  
  _callOnButtonPressIn: function(index, isLeft) {
    if (this.props.onButtonPressIn) this.props.onButtonPressIn(this.props.sectionID, this.props.rowID, index, isLeft);
  },
  
  _callOnButtonPressOut: function(index, isLeft) {
    if (this.props.onButtonPressOut) this.props.onButtonPressOut(this.props.sectionID, this.props.rowID, index, isLeft);
  },

  _openRight: function() {
    this.refs.swipeoutContent.measure((ox, oy, width, height) => {
      this.setState({
        btnWidth: (width/5),
        btnsRightWidth: this.props.right ? (width/5)*this.props.right.length : 0,
      }, () => {
        this._tweenContent('contentPos', -this.state.btnsRightWidth);
        this._callOnOpen();
        this.setState({ 
          contentPos: -this.state.btnsRightWidth, 
          openedLeft: false, 
          openedRight: true, 
          swiping: false 
        });
      });
    });
  },

  _openLeft: function() {
    this.refs.swipeoutContent.measure((ox, oy, width, height) => {
      this.setState({
        btnWidth: (width/5),
        btnsLeftWidth: this.props.left ? (width/5)*this.props.left.length : 0,
      }, () => {
        this._tweenContent('contentPos', this.state.btnsLeftWidth);
        this._callOnOpen();
        this.setState({ 
          contentPos: this.state.btnsLeftWidth, 
          openedLeft: true, 
          openedRight: false, 
          swiping: false 
        });
      });
    });
  },

  render: function() {
    var contentWidth = this.state.contentWidth;
    var posX = this.getTweeningValue('contentPos');

    var styleSwipeout = [styles.swipeout, this.props.style];
    if (this.props.backgroundColor) {
      styleSwipeout.push([{ backgroundColor: this.props.backgroundColor }]);
    }

    var limit = -this.state.btnsRightWidth;
    if (posX > 0) var limit = this.state.btnsLeftWidth;

    var styleLeftPos = {
      left: {
        left: 0,
        overflow: 'hidden',
        width: Math.min(limit*(posX/limit), limit),
      },
    };
    var styleRightPos = {
      right: {
        left: Math.abs(contentWidth + Math.max(limit, posX)),
        right: 0,
      },
    };
    var styleContentPos = {
      content: {
        left: this._rubberBandEasing(posX, limit),
      },
    };

    var styleContent = [styles.swipeoutContent];
    styleContent.push(styleContentPos.content);

    var styleRight = [styles.swipeoutBtns];
    styleRight.push(styleRightPos.right);

    var styleLeft = [styles.swipeoutBtns];
    styleLeft.push(styleLeftPos.left);

    var isRightVisible = posX < 0;
    var isLeftVisible = posX > 0;

    return (
      <View style={styleSwipeout}>
        <View
          ref="swipeoutContent"
          style={styleContent}
          onLayout={this._onLayout}
          {...this._panResponder.panHandlers}
        >
          {this.props.children}
        </View>
        { this._renderButtons(this.props.right, isRightVisible, styleRight, false) }
        { this._renderButtons(this.props.left, isLeftVisible, styleLeft, true) }
      </View>
    );
  },

  _onLayout: function(event) {
    var { width, height } = event.nativeEvent.layout;
    this.setState({
      contentWidth: width,
      contentHeight: height,
    });
  },

  _renderButtons: function(buttons, isVisible, style, isLeft) {
    if (buttons && isVisible) {
      return( <View style={style}>
        { 
          buttons.map((btn, index) => {
            return this._renderButton(btn, index, isLeft)
          }
        }
      </View>);
    } else {
      return (
        <View/>
      );
    }
  },

  _renderButton: function(btn, i, isLeft) {
    return (
      <SwipeoutBtn
        backgroundColor={btn.backgroundColor}
        color={btn.color}
        component={btn.component}
        disabled={btn.disabled}
        height={this.state.contentHeight}
        key={i}
        onPress={() => this._autoClose(btn, i, isLeft)}
        onPressIn={() => this._callOnButtonPressIn(btn, i, isLeft)}
        onPressOut={() => this._callOnButtonPressOut(btn, i, isLeft)}
        text={btn.text}
        type={btn.type}
        underlayColor={btn.underlayColor}
        width={this.state.btnWidth}
      />
    );
  }
})

Swipeout.NativeButton = NativeButton;
Swipeout.SwipeoutButton = SwipeoutBtn;

export default Swipeout;
