(function() {
    'use strict';

    angular
        .module('ui-chat-app')
        .directive('aiChatBody', aiChatBody);

    function aiChatBody($timeout, comunicationService, $q, speechDatabase, externalResourcesService) {
        var directive = {
            restrict: 'E',
            templateUrl: 'components/views/aibody.html',
            link: linkFunction
        };
        return directive;

        function linkFunction($scope) {

            $scope.conversation = [];
            $scope.userMessage;
            $scope.fullInfo;
            $scope.showMoreInfo = false;
            $scope.showImages = false;
            $scope.photosToShow = [];

            function init () {
                processChatMessage('', true);
            }
            
            function processChatMessage(message, isInit) {
                message = message.toLowerCase();
                var aiResponses = [];

                var aiMessage = {};
                aiMessage.type = 'ai';
                aiMessage.content = null;


                if (isInit) {
                    aiMessage.content = _.sample(speechDatabase.globalResponses.welcome);
                    $scope.conversation.push(aiMessage);
                    autoChatScroll();
                } else {
                    $q.all([comunicationService.checkIfAskedForWeather(message),
                        comunicationService.checkIfNeedWikiData(message),
                        comunicationService.checkIfAskedForImage(message)]
                        ).then(function(data) {
                        aiResponses.push(data[0].content, data[1].content, data[2].content, comunicationService.checkIfAskedForName(message), 
                            comunicationService.checkForSimpleQuestionWithReplaceWar(message, speechDatabase.specificResponses.askedForAgeObject, 'MY_AGE', speechDatabase.specificResponses.askedForAgeObject.age), 
                            comunicationService.checkIfUserToldName(message), 
                            comunicationService.checkForSimpleQuestion(message, speechDatabase.specificResponses.greetingsObject),
                            comunicationService.checkForSimpleQuestion(message, speechDatabase.specificResponses.askedForPurposeObject),
                            comunicationService.checkForSimpleQuestion(message, speechDatabase.specificResponses.askedHowAreYouObject),
                            comunicationService.checkForSimpleQuestion(message, speechDatabase.specificResponses.askedAboutHimselfObject),
                            comunicationService.checkForSimpleQuestionWithReplaceWar(message, speechDatabase.specificResponses.askedPersonalAreYouObject, 'ASKED_VALUE', speechDatabase.specificResponses.askedPersonalAreYouObject.askedValues[0]));

                        aiMessage.content = getCorrectAnswer(aiResponses);

                        if(data[1].fullContent) {
                            $scope.showHelp = false;
                            $scope.fullInfo = data[1].fullContent;
                            $scope.showMoreInfo = true;
                            $scope.showImages = false;
                        }

                        if(data[2].photos) {
                            $scope.showHelp = false;
                            $scope.photosToShow = data[2].photos;
                            $scope.showMoreInfo = false;
                            $scope.showImages = true;
                        }

                        if (_.isEmpty(aiMessage.content)) {
                            aiMessage.content = _.sample(speechDatabase.globalResponses.questionNotDefinedProperly);
                        }

                        $scope.conversation.push(aiMessage);
                        autoChatScroll();
                    });
                }
            }

            $scope.sendMessage = function(message) {
                $scope.fullInfo = '';
                $scope.showMoreInfo = false;
                $scope.showImages = false;
                if (!_.isEmpty(message)) {
                    var chatMessage = {};
                    chatMessage.type = 'user';
                    chatMessage.content = message;
                    $scope.conversation.push(chatMessage);
                    $scope.userMessage = '';
                    processChatMessage(message, false);
                }
            };

            $scope.toggleHelp = function () {
                $scope.showMoreInfo = false;
                $scope.showHelp = !$scope.showHelp;
            };

            function getCorrectAnswer(answers) {
                var answer;
                angular.forEach(answers, function(value) {
                    if (!_.isEmpty(value)) {
                        answer = value;
                    }
                });
                return answer;
            }

            function autoChatScroll() {
                $timeout(function() {
                    var box = document.getElementById('conversation');
                    box.scrollTop = box.scrollHeight;
                });
            }

            init();
        }
    }
})();