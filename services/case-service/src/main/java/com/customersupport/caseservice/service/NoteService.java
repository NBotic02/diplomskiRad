package com.customersupport.caseservice.service;

import com.customersupport.caseservice.domain.entity.CaseNote;
import com.customersupport.caseservice.dto.request.CreateNoteRequest;
import com.customersupport.caseservice.dto.response.NoteResponse;
import com.customersupport.caseservice.exception.ResourceNotFoundException;
import com.customersupport.caseservice.repository.CaseNoteRepository;
import com.customersupport.caseservice.repository.CaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final CaseNoteRepository repo;
    private final CaseRepository     caseRepo;
    private final EntityMapper       mapper;

    public List<NoteResponse> listForCase(UUID caseId) {
        ensureCaseExists(caseId);
        return repo.findAllByCaseIdOrderByIsPinnedDescCreatedAtDesc(caseId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public NoteResponse add(UUID caseId, CreateNoteRequest req) {
        ensureCaseExists(caseId);

        CaseNote toSave = CaseNote.builder()
                .caseId(caseId)
                .authorId(req.authorId())
                .content(req.content())
                .isPinned(req.pinnedOrFalse())
                .build();
        CaseNote saved = repo.saveAndFlush(toSave);
        saved = repo.findById(saved.getNoteId()).orElseThrow();

        return mapper.toResponse(saved);
    }

    private void ensureCaseExists(UUID caseId) {
        if (!caseRepo.existsById(caseId)) {
            throw new ResourceNotFoundException("Case", caseId);
        }
    }
}
