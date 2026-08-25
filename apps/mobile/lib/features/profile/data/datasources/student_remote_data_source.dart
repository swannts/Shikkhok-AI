import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../dto/student_profile_dto.dart';

abstract interface class StudentRemoteDataSource {
  Future<StudentProfileDto> getMyProfile();

  Future<StudentProfileDto> upsertMyProfile({
    required int classLevel,
    required String medium,
    required int curriculumYear,
    String? schoolName,
    String? district,
    String? upazila,
    String? board,
    String? academicStream,
    String? guardianPhone,
    List<String>? preferredSubjects,
    List<String>? learningGoals,
    String? dateOfBirth,
  });
}

class StudentRemoteDataSourceImpl implements StudentRemoteDataSource {
  final ApiClient _client;

  StudentRemoteDataSourceImpl(this._client);

  @override
  Future<StudentProfileDto> getMyProfile() async {
    final res = await _client.dio.get(ApiEndpoints.studentsMe);
    final data = _extractData(res.data);
    return StudentProfileDto.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<StudentProfileDto> upsertMyProfile({
    required int classLevel,
    required String medium,
    required int curriculumYear,
    String? schoolName,
    String? district,
    String? upazila,
    String? board,
    String? academicStream,
    String? guardianPhone,
    List<String>? preferredSubjects,
    List<String>? learningGoals,
    String? dateOfBirth,
  }) async {
    final payload = <String, dynamic>{
      'classLevel': classLevel,
      'medium': medium,
      'curriculumYear': curriculumYear,
      if (schoolName != null && schoolName.isNotEmpty) 'schoolName': schoolName,
      if (district != null && district.isNotEmpty) 'district': district,
      if (upazila != null && upazila.isNotEmpty) 'upazila': upazila,
      if (board != null && board.isNotEmpty) 'board': board,
      if (academicStream != null && academicStream.isNotEmpty)
        'academicStream': academicStream,
      if (guardianPhone != null && guardianPhone.isNotEmpty)
        'guardianPhone': guardianPhone,
      if (preferredSubjects != null && preferredSubjects.isNotEmpty)
        'preferredSubjects': preferredSubjects,
      if (learningGoals != null && learningGoals.isNotEmpty)
        'learningGoals': learningGoals,
      if (dateOfBirth != null && dateOfBirth.isNotEmpty)
        'dateOfBirth': dateOfBirth,
    };

    final res = await _client.dio.put(
      ApiEndpoints.studentsMe,
      data: payload,
    );

    final data = _extractData(res.data);
    return StudentProfileDto.fromJson(data as Map<String, dynamic>);
  }

  dynamic _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic> &&
        responseData.containsKey('data')) {
      return responseData['data'];
    }
    return responseData;
  }
}
